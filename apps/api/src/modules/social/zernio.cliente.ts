import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { SocialConfigService } from './social-config.service';

/**
 * O ÚNICO PONTO QUE FALA COM O ZERNIO.
 *
 * Todo o resto do sistema — inclusive a tela — passa por aqui. O navegador
 * jamais recebe a chave: ele chama `/api/social/*`, e é esta classe que
 * carimba o `Authorization`. Se um dia a integração trocar de fornecedor,
 * troca-se este arquivo e mais nada.
 *
 * Três disciplinas que o painel depende:
 *
 *  • TIMEOUT — o Zernio consulta as APIs das redes ao vivo (Meta, TikTok,
 *    LinkedIn…). Uma rede lenta não pode segurar a tela inteira, então cada
 *    chamada aborta sozinha.
 *  • CACHE — abrir a tela dispara meia dúzia de leituras, e trocar de aba
 *    dispara de novo. 45 segundos de cache por URL cortam isso sem nunca
 *    mostrar número velho o bastante para enganar. Toda escrita limpa o que
 *    ela invalidaria.
 *  • ERRO TRADUZIDO — 401 e 429 viram código próprio, porque a tela reage
 *    diferente a cada um: um manda conferir a chave, o outro manda esperar.
 */

const BASE = 'https://zernio.com/api';
const TEMPO_LIMITE_MS = 20_000;
const CACHE_MS = 45_000;

export interface ErroZernio {
  codigo: 'SEM_CHAVE' | 'CHAVE_RECUSADA' | 'LIMITE_EXCEDIDO' | 'ZERNIO_ERRO' | 'ZERNIO_INDISPONIVEL';
  message: string;
}

@Injectable()
export class ZernioCliente {
  private readonly logger = new Logger(ZernioCliente.name);
  private readonly cache = new Map<string, { em: number; dados: unknown }>();

  constructor(private readonly config: SocialConfigService) {}

  async temChave(): Promise<boolean> {
    return !!(await this.config.chave());
  }

  get<T>(caminho: string, params?: Record<string, string | number | undefined | null>): Promise<T> {
    return this.chamar<T>('GET', this.comQuery(caminho, params));
  }

  /** Igual ao `get`, com resposta guardada por 45s. Só para leitura pura. */
  async getCacheado<T>(
    caminho: string,
    params?: Record<string, string | number | undefined | null>,
  ): Promise<T> {
    const url = this.comQuery(caminho, params);
    const guardado = this.cache.get(url);
    if (guardado && Date.now() - guardado.em < CACHE_MS) return guardado.dados as T;
    const dados = await this.chamar<T>('GET', url);
    this.cache.set(url, { em: Date.now(), dados });
    return dados;
  }

  post<T>(caminho: string, corpo?: unknown): Promise<T> {
    return this.chamar<T>('POST', caminho, corpo);
  }

  put<T>(caminho: string, corpo?: unknown): Promise<T> {
    return this.chamar<T>('PUT', caminho, corpo);
  }

  delete<T>(caminho: string): Promise<T> {
    return this.chamar<T>('DELETE', caminho);
  }

  /** Esquece o que foi lido de um recurso. Chamado depois de toda escrita —
   *  publicar e ver a lista velha por 45s pareceria bug. */
  esquecer(prefixo: string): void {
    for (const url of this.cache.keys()) {
      if (url.startsWith(prefixo)) this.cache.delete(url);
    }
  }

  private comQuery(
    caminho: string,
    params?: Record<string, string | number | undefined | null>,
  ): string {
    if (!params) return caminho;
    const busca = new URLSearchParams();
    for (const [chave, valor] of Object.entries(params)) {
      if (valor !== undefined && valor !== null && valor !== '') busca.set(chave, String(valor));
    }
    const query = busca.toString();
    return query ? `${caminho}?${query}` : caminho;
  }

  private async chamar<T>(metodo: string, caminho: string, corpo?: unknown): Promise<T> {
    const chave = await this.config.chave();
    if (!chave) {
      throw new ServiceUnavailableException({
        codigo: 'SEM_CHAVE',
        message: 'A integração com o Zernio ainda não foi configurada.',
      } satisfies ErroZernio);
    }

    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), TEMPO_LIMITE_MS);
    let resposta: Response;
    try {
      resposta = await fetch(`${BASE}${caminho}`, {
        method: metodo,
        headers: {
          Authorization: `Bearer ${chave}`,
          ...(corpo !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(corpo !== undefined ? { body: JSON.stringify(corpo) } : {}),
        signal: controlador.signal,
      });
    } catch {
      throw new ServiceUnavailableException({
        codigo: 'ZERNIO_INDISPONIVEL',
        message: 'O Zernio não respondeu a tempo. Tente de novo em instantes.',
      } satisfies ErroZernio);
    } finally {
      clearTimeout(relogio);
    }

    if (!resposta.ok) throw this.traduzirFalha(resposta, metodo, caminho, await resposta.text().catch(() => ''));
    if (resposta.status === 204) return undefined as T;
    return (await resposta.json()) as T;
  }

  private traduzirFalha(resposta: Response, metodo: string, caminho: string, texto: string) {
    // O corpo do erro vai para o log e NÃO para a tela: ele às vezes ecoa parte
    // da chave e sempre vem em inglês.
    this.logger.warn(`zernio ${metodo} ${caminho} → ${resposta.status}: ${texto.slice(0, 300)}`);

    if (resposta.status === 401 || resposta.status === 403) {
      return new ServiceUnavailableException({
        codigo: 'CHAVE_RECUSADA',
        message: 'O Zernio recusou a chave. Confira em Redes sociais → Configuração.',
      } satisfies ErroZernio);
    }
    if (resposta.status === 429) {
      const espera = Number(resposta.headers.get('retry-after') ?? 0);
      return new ServiceUnavailableException({
        codigo: 'LIMITE_EXCEDIDO',
        message: espera
          ? `Limite de chamadas do Zernio atingido. Tente de novo em ${espera}s.`
          : 'Limite de chamadas do Zernio atingido. Tente de novo em instantes.',
      } satisfies ErroZernio);
    }
    // 400 costuma trazer o motivo real (legenda longa demais, conta sem
    // permissão de publicar…). Repassa quando o texto é curto e legível.
    const detalhe = this.motivo(texto);
    return new ServiceUnavailableException({
      codigo: 'ZERNIO_ERRO',
      message: detalhe ?? 'O Zernio não conseguiu atender agora.',
    } satisfies ErroZernio);
  }

  /** A mensagem do Zernio, quando ela é curta o bastante para caber na tela. */
  private motivo(texto: string): string | null {
    try {
      const json = JSON.parse(texto) as { error?: string; message?: string; details?: string };
      const bruto = json.message ?? json.error ?? json.details;
      return bruto && bruto.length <= 240 ? bruto : null;
    } catch {
      return null;
    }
  }
}
