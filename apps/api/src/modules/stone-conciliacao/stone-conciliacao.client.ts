import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { gunzipSync } from 'node:zlib';

/**
 * Cliente HTTP da API de Conciliação Stone — fluxo "Cliente Stone (lojista)".
 *
 * Doc: https://conciliacao.stone.com.br/reference/overview-da-api-cliente-stone
 *
 *   GET https://conciliation.stone.com.br/v2/merchant/{StoneCode}/conciliation-file/{AAAAMMDD}?layout=XML2_2
 *   Headers:
 *     Authorization: Basic base64("<chave>:")   (chave do Portal Stone, senha vazia)
 *     x-user-type: client                        (OBRIGATÓRIO — sem ele a API dá 401)
 *     Accept-Encoding: gzip
 *
 * Devolve o extrato do dia em XML (gzip). Só disponível após 5h da manhã do dia
 * seguinte ao de referência. 307 = arquivo já em cache (seguir Location).
 *
 * Envs:
 *   STONE_CONCILIACAO_KEY   — chave do Portal Stone (API de Conciliação)
 *   STONE_CODE              — StoneCode (número de afiliação) da conta
 *   STONE_CONCILIACAO_BASE  — opcional; default https://conciliation.stone.com.br
 */

const TIMEOUT_MS = 120_000; // doc: cada requisição tem limite de 2 min
const BASE_DEFAULT = 'https://conciliation.stone.com.br';

@Injectable()
export class StoneConciliacaoClient {
  private readonly logger = new Logger(StoneConciliacaoClient.name);
  private readonly base = (process.env.STONE_CONCILIACAO_BASE ?? BASE_DEFAULT).replace(/\/$/, '');
  private readonly chave = process.env.STONE_CONCILIACAO_KEY ?? '';
  private readonly stoneCodeEnv = process.env.STONE_CODE ?? '';

  get configurado(): boolean {
    return !!this.chave && !!this.stoneCodeEnv;
  }

  get stoneCode(): string {
    return this.stoneCodeEnv;
  }

  private get authHeader(): string {
    // Basic base64("<chave>:") — usuário = chave, senha vazia.
    return `Basic ${Buffer.from(`${this.chave}:`).toString('base64')}`;
  }

  /**
   * Baixa o arquivo de conciliação de um dia (AAAAMMDD) e devolve o XML já
   * descomprimido como string. Retorna `null` quando não há arquivo (404/vazio).
   */
  async baixarArquivo(referenceDate: string, stoneCode?: string, layout: 'XML2_2' | 'XML2_4' = 'XML2_2'): Promise<string | null> {
    if (!this.chave) {
      throw new ServiceUnavailableException({ codigo: 'STONE_CONC_SEM_CHAVE', message: 'Conciliação Stone não configurada (STONE_CONCILIACAO_KEY ausente).' });
    }
    const code = stoneCode || this.stoneCodeEnv;
    if (!code) {
      throw new ServiceUnavailableException({ codigo: 'STONE_CONC_SEM_STONECODE', message: 'StoneCode não configurado (STONE_CODE ausente).' });
    }

    const url = `${this.base}/v2/merchant/${encodeURIComponent(code)}/conciliation-file/${referenceDate}?layout=${layout}`;
    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), TIMEOUT_MS);
    let resposta: Response;
    try {
      resposta = await fetch(url, {
        method: 'GET',
        redirect: 'follow', // 307 → arquivo cacheado
        signal: controlador.signal,
        headers: {
          Authorization: this.authHeader,
          'x-user-type': 'client',
          'Accept-Encoding': 'gzip',
        },
      });
    } catch (e) {
      this.logger.error(`Conciliação Stone indisponível (${referenceDate}): ${String(e).slice(0, 150)}`);
      throw new ServiceUnavailableException({ codigo: 'STONE_CONC_INDISPONIVEL', message: 'API de Conciliação Stone indisponível. Tente novamente.' });
    } finally {
      clearTimeout(relogio);
    }

    if (resposta.status === 404) {
      this.logger.warn(`Conciliação Stone: sem arquivo para ${referenceDate} (404).`);
      return null;
    }
    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => '');
      this.logger.error(`Conciliação Stone ${resposta.status} (${referenceDate}): ${corpo.slice(0, 200)}`);
      if (resposta.status === 401) throw new ServiceUnavailableException({ codigo: 'STONE_CONC_AUTH', message: 'Autenticação na Conciliação Stone falhou (verifique chave e header x-user-type).' });
      if (resposta.status === 403) throw new ServiceUnavailableException({ codigo: 'STONE_CONC_FORBIDDEN', message: 'Chave não pertence ao documento do StoneCode informado.' });
      throw new ServiceUnavailableException({ codigo: 'STONE_CONC_ERRO', message: `Falha na Conciliação Stone (${resposta.status}).` });
    }

    // O corpo pode vir gzip (por causa do Accept-Encoding) — o fetch do Node já
    // descomprime transparentemente quíando o Content-Encoding vem setado. Mas a
    // Stone às vezes entrega o gzip como corpo bruto: tentamos texto e, se não for
    // XML, descomprimimos manualmente.
    const buf = Buffer.from(await resposta.arrayBuffer());
    const texto = buf.toString('utf8');
    if (texto.trimStart().startsWith('<?xml') || texto.includes('<Conciliation')) return texto;
    try {
      const descomprimido = gunzipSync(buf).toString('utf8');
      if (descomprimido.includes('<Conciliation') || descomprimido.trimStart().startsWith('<?xml')) return descomprimido;
    } catch {
      // não era gzip
    }
    this.logger.warn(`Conciliação Stone: resposta não reconhecida como XML para ${referenceDate}.`);
    return texto || null;
  }
}
