import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { cifrar, decifrar } from '../agentes/agentes.service';
import type { ResultadoBusca } from './brain.service';

/**
 * QUEM ESCREVE A RESPOSTA.
 *
 * A recuperação é do gbrain (busca híbrida, já recortada pela credencial da
 * pessoa). A SÍNTESE saiu de lá e passou a ser feita aqui, por três motivos
 * que só apareceram com o sistema rodando:
 *
 *  1. O `think` do gbrain só aceita provedor com touchpoint de chat na
 *     receita dele. O modelo local (Ollama) não tem — e com o modelo local
 *     atravessado por um adaptador genérico a resposta levava 100 a 145
 *     segundos e às vezes voltava vazia ou em formato de tabela quebrada.
 *  2. A chave do provedor precisa ser trocável PELA TELA. No gbrain ela mora
 *     no config do container: trocar exigiria deploy.
 *  3. Aqui o prompt é nosso — responde em português, cita a página e diz
 *     quando não sabe, em vez de inventar.
 *
 * O recorte de acesso não muda: os trechos que chegam aqui já vieram da busca
 * feita com a credencial da pessoa, então o modelo nunca lê setor alheio.
 */
@Injectable()
export class SinteseService {
  private readonly logger = new Logger(SinteseService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async configuracao() {
    const linha = await this.linha();
    return {
      temChave: !!linha.chaveOpenai,
      modelo: linha.modelo,
      // Sem chave a síntese existe, só é lenta: o modelo local da VPS.
      provedor: linha.chaveOpenai ? ('openai' as const) : ('local' as const),
      atualizadoEm: linha.atualizadoEm,
    };
  }

  /** `chaveOpenai: null` apaga e devolve o motor para o modelo local. */
  async salvar(dados: { chaveOpenai?: string | null; modelo?: string }, autorId: string) {
    if (dados.chaveOpenai !== undefined && dados.chaveOpenai !== null) {
      const chave = dados.chaveOpenai.trim();
      // Só a forma, nunca a validade — quem valida é a OpenAI no primeiro uso,
      // e o botão "Testar" da tela existe para isso.
      if (!/^sk-[A-Za-z0-9_-]{20,}$/.test(chave)) {
        throw new BadRequestException({
          codigo: 'CHAVE_INVALIDA',
          message: 'A chave da OpenAI começa com "sk-" e tem mais de 20 caracteres.',
        });
      }
    }
    await this.prisma.brainConfig.upsert({
      where: { id: 'brain' },
      create: {
        id: 'brain',
        chaveOpenai: dados.chaveOpenai ? cifrar(this.config, dados.chaveOpenai.trim()) : null,
        ...(dados.modelo ? { modelo: dados.modelo } : {}),
        atualizadoPor: autorId,
      },
      update: {
        ...(dados.chaveOpenai !== undefined
          ? { chaveOpenai: dados.chaveOpenai ? cifrar(this.config, dados.chaveOpenai.trim()) : null }
          : {}),
        ...(dados.modelo ? { modelo: dados.modelo } : {}),
        atualizadoPor: autorId,
      },
    });
    return this.configuracao();
  }

  /** Há provedor pago configurado? Decide entre sintetizar aqui ou no gbrain. */
  async temProvedor(): Promise<boolean> {
    return !!(await this.linha()).chaveOpenai;
  }

  /**
   * Uma chamada, sem histórico. A resposta é fundamentada NOS TRECHOS e o
   * prompt manda dizer que não sabe quando eles não bastam — numa memória
   * institucional, resposta inventada é pior do que resposta ausente.
   */
  async responder(pergunta: string, trechos: ResultadoBusca[]) {
    const linha = await this.linha();
    if (!linha.chaveOpenai) {
      throw new ServiceUnavailableException({
        codigo: 'SEM_PROVEDOR',
        message: 'Nenhum provedor de resposta configurado.',
      });
    }
    const chave = decifrar(this.config, linha.chaveOpenai);

    const contexto = trechos
      .map((t, i) => `[${i + 1}] ${t.titulo} (${t.slug})\n${t.trecho}`)
      .join('\n\n');

    const corpo = {
      model: linha.modelo,
      messages: [
        {
          role: 'system',
          content:
            'Você responde perguntas sobre a Febracis Salvador usando APENAS os trechos ' +
            'da memória institucional que receber. Escreva em português do Brasil, direto, ' +
            'em no máximo dois parágrafos curtos. Cite as fontes usadas no formato [1], [2] ' +
            'ao longo do texto. Se os trechos não responderem à pergunta, diga exatamente ' +
            'isso e sugira o que registrar na memória — nunca invente número, política ou nome.',
        },
        {
          role: 'user',
          content: `Trechos da memória:\n\n${contexto}\n\n---\nPergunta: ${pergunta}`,
        },
      ],
      temperature: 0.2,
      max_tokens: 700,
    };

    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), 90_000);
    let resposta: Response;
    try {
      resposta = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${chave}` },
        body: JSON.stringify(corpo),
        signal: controlador.signal,
      });
    } catch {
      throw new ServiceUnavailableException({
        codigo: 'PROVEDOR_INDISPONIVEL',
        message: 'Não foi possível falar com a OpenAI.',
      });
    } finally {
      clearTimeout(relogio);
    }

    if (!resposta.ok) {
      const texto = await resposta.text().catch(() => '');
      // A mensagem do provedor vai para o log, não para a tela: ela às vezes
      // ecoa parte da chave.
      this.logger.warn(`openai ${resposta.status}: ${texto.slice(0, 200)}`);
      throw new ServiceUnavailableException({
        codigo: resposta.status === 401 ? 'CHAVE_RECUSADA' : 'PROVEDOR_ERRO',
        message:
          resposta.status === 401
            ? 'A OpenAI recusou a chave configurada. Confira em Configurações → Memória institucional.'
            : 'A OpenAI não conseguiu responder agora.',
      });
    }

    const json = (await resposta.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const texto = json.choices?.[0]?.message?.content?.trim() ?? '';

    // Só as fontes REALMENTE citadas viram chip na tela — listar as dez que
    // foram ao prompt daria a impressão de que todas sustentam a resposta.
    const citados = new Set(
      [...texto.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])).filter((n) => n >= 1 && n <= trechos.length),
    );
    const citacoes = [...citados].map((n) => {
      const t = trechos[n - 1];
      return { slug: t.slug, titulo: t.titulo, fonte: t.fonte };
    });

    return {
      resposta: texto,
      citacoes: citacoes.length ? citacoes : trechos.slice(0, 3).map((t) => ({ slug: t.slug, titulo: t.titulo, fonte: t.fonte })),
      modelo: linha.modelo,
      tokens: json.usage?.total_tokens ?? null,
    };
  }

  private async linha() {
    const achada = await this.prisma.brainConfig.findUnique({ where: { id: 'brain' } });
    if (achada) return achada;
    return this.prisma.brainConfig.create({ data: { id: 'brain' } });
  }
}
