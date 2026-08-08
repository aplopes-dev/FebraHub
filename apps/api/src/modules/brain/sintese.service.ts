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

  /** Há provedor pago configurado? */
  async temProvedor(): Promise<boolean> {
    return !!(await this.linha()).chaveOpenai;
  }

  private readonly promptFinal =
    'Você é a memória institucional da Febracis Salvador. Responda à pergunta ' +
    'usando APENAS os registros da memória listados abaixo. ' +
    'Linguagem natural, clara, para gestores — sem jargão técnico (slug, score, API, embedding). ' +
    'Resposta direta e completa: números e nomes quando estiverem nos registros. ' +
    'Cite com [1], [2], [3]… na ordem em que usar os registros da lista abaixo ' +
    '(o primeiro registro usado é [1], o segundo distinto é [2] — não pule números). ' +
    'PROIBIDO: frases como "nos trechos disponíveis", "o trecho não mostra", ' +
    '"seria útil registrar", "não dá para confirmar porque o registro está incompleto", ' +
    '"com base nos trechos". Se o fato estiver nos registros, afirme. ' +
    'Se, depois de todos os registros, o fato realmente não existir, diga só: ' +
    '"Não há esse registro na memória institucional." — sem sugerir o que cadastrar. ' +
    'Nunca invente número, política, cargo ou nome.';

  /** Redação final após o agente reunir o acervo. */
  async responderFinal(pergunta: string, trechos: ResultadoBusca[]) {
    return this.responderComPrompt(pergunta, trechos, this.promptFinal);
  }

  /** Compat: mesma redação final (o fluxo novo passa pelo agente). */
  async responder(pergunta: string, trechos: ResultadoBusca[]) {
    return this.responderFinal(pergunta, trechos);
  }

  /**
   * O agente decide a próxima ação via function calling (OpenAI).
   * Sem chave, devolve lista vazia — o caller fecha com o acervo atual.
   */
  async planejarFerramentas(
    messages: { role: string; content: string }[],
  ): Promise<{ nome: string; args: Record<string, unknown> }[]> {
    const linha = await this.linha();
    if (!linha.chaveOpenai) return [];

    const chave = decifrar(this.config, linha.chaveOpenai);
    const limiarNovo = /^(gpt-5|o\d)/i.test(linha.modelo);
    const corpo: Record<string, unknown> = {
      model: linha.modelo,
      messages,
      tools: FERRAMENTAS_AGENTE,
      tool_choice: 'auto',
      // gpt-5.6-luna: tools no chat/completions exigem reasoning_effort=none.
      ...(limiarNovo
        ? { max_completion_tokens: 700, reasoning_effort: 'none' }
        : { temperature: 0.2, max_tokens: 700 }),
    };

    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), 60_000);
    let resposta: Response;
    try {
      resposta = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${chave}`,
        },
        body: JSON.stringify(corpo),
        signal: controlador.signal,
      });
    } catch {
      return [];
    } finally {
      clearTimeout(relogio);
    }

    if (!resposta.ok) {
      const texto = await resposta.text().catch(() => '');
      this.logger.warn(`planejar ${resposta.status}: ${texto.slice(0, 200)}`);
      return [];
    }

    const json = (await resposta.json()) as {
      choices?: {
        message?: {
          content?: string | null;
          tool_calls?: { function?: { name?: string; arguments?: string } }[];
        };
      }[];
    };
    const msg = json.choices?.[0]?.message;
    const calls = msg?.tool_calls ?? [];
    if (calls.length) {
      return calls.map((c) => {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(c.function?.arguments || '{}') as Record<string, unknown>;
        } catch {
          args = {};
        }
        return { nome: c.function?.name ?? '', args };
      }).filter((c) => c.nome);
    }

    // Alguns modelos devolvem JSON no content em vez de tool_calls.
    const texto = msg?.content?.trim() ?? '';
    if (texto.startsWith('{')) {
      try {
        const o = JSON.parse(texto) as { nome?: string; consulta?: string; slug?: string; resposta?: string };
        if (o.nome) return [{ nome: o.nome, args: o as Record<string, unknown> }];
        if (o.resposta) return [{ nome: 'responder', args: { resposta: o.resposta } }];
      } catch {
        /* ignore */
      }
    }
    if (texto.length > 40) {
      return [{ nome: 'responder', args: { resposta: texto } }];
    }
    return [];
  }

  private async responderComPrompt(
    pergunta: string,
    trechos: ResultadoBusca[],
    system: string,
  ) {
    const linha = await this.linha();
    const contexto = trechos
      .map((t, i) => `[${i + 1}] ${t.titulo}\n${t.trecho}`)
      .join('\n\n');
    const messages = [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `Registros da memória:\n\n${contexto}\n\n---\nPergunta: ${pergunta}`,
      },
    ];

    if (linha.chaveOpenai) {
      const chave = decifrar(this.config, linha.chaveOpenai);
      return this.chamarChat({
        url: 'https://api.openai.com/v1/chat/completions',
        headers: { Authorization: `Bearer ${chave}` },
        model: linha.modelo,
        messages,
        trechos,
        timeoutMs: 90_000,
      });
    }

    const modeloLocal =
      this.config.get<string>('BRAIN_MODELO_CHAT') ||
      process.env.BRAIN_MODELO_CHAT ||
      'qwen2.5:3b-instruct';
    const base =
      this.config.get<string>('OLLAMA_BASE_URL') ||
      process.env.OLLAMA_BASE_URL ||
      'http://ollama:11434/v1';
    try {
      return await this.chamarChat({
        url: `${base.replace(/\/$/, '')}/chat/completions`,
        headers: {},
        model: modeloLocal.replace(/^ollama:/, '').replace(/^litellm:/, ''),
        messages,
        trechos,
        timeoutMs: 180_000,
      });
    } catch (e) {
      this.logger.warn(`síntese local falhou — ${(e as Error).message}; caindo no extrato`);
      return this.respostaExtrativa(pergunta, trechos);
    }
  }

  /** Último recurso: devolve os trechos mais relevantes sem LLM. */
  respostaExtrativa(pergunta: string, trechos: ResultadoBusca[]) {
    if (!trechos.length) {
      return {
        resposta:
          'Não encontrei nada na memória institucional sobre isso — dentro das fontes que você alcança.',
        citacoes: [] as { slug: string; titulo: string; fonte: string }[],
        modelo: 'extrativo',
        tokens: null as number | null,
      };
    }
    const topo = trechos.slice(0, 3);
    const resumo = topo
      .map((t, i) => `${i + 1}. ${t.titulo}: ${t.trecho.replace(/\s+/g, ' ').trim().slice(0, 220)}`)
      .join('\n');
    return {
      resposta: resumo,
      citacoes: topo.map((t) => ({ slug: t.slug, titulo: t.titulo, fonte: t.fonte })),
      modelo: 'extrativo',
      tokens: null,
    };
  }

  private async chamarChat(opts: {
    url: string;
    headers: Record<string, string>;
    model: string;
    messages: { role: string; content: string }[];
    trechos: ResultadoBusca[];
    timeoutMs: number;
  }) {
    // gpt-5* / o*: max_completion_tokens; temperature só no default (1) — não enviar.
    const limiarNovo = /^(gpt-5|o\d)/i.test(opts.model);
    const corpo: Record<string, unknown> = {
      model: opts.model,
      messages: opts.messages,
      ...(limiarNovo
        ? { max_completion_tokens: 1200 }
        : { temperature: 0.2, max_tokens: 900 }),
    };
    const controlador = new AbortController();
    const relogio = setTimeout(() => controlador.abort(), opts.timeoutMs);
    let resposta: Response;
    try {
      resposta = await fetch(opts.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...opts.headers },
        body: JSON.stringify(corpo),
        signal: controlador.signal,
      });
    } catch {
      throw new ServiceUnavailableException({
        codigo: 'PROVEDOR_INDISPONIVEL',
        message: 'Não foi possível falar com o motor de resposta.',
      });
    } finally {
      clearTimeout(relogio);
    }

    if (!resposta.ok) {
      const texto = await resposta.text().catch(() => '');
      this.logger.warn(`chat ${resposta.status}: ${texto.slice(0, 200)}`);
      throw new ServiceUnavailableException({
        codigo: resposta.status === 401 ? 'CHAVE_RECUSADA' : 'PROVEDOR_ERRO',
        message:
          resposta.status === 401
            ? 'A OpenAI recusou a chave configurada. Confira em Configurações → Memória institucional.'
            : 'O motor de resposta não conseguiu responder agora.',
      });
    }

    const json = (await resposta.json()) as {
      choices?: { message?: { content?: string } }[];
      usage?: { total_tokens?: number };
    };
    const texto = json.choices?.[0]?.message?.content?.trim() ?? '';
    if (!texto) {
      throw new ServiceUnavailableException({
        codigo: 'RESPOSTA_VAZIA',
        message: 'O motor de resposta devolveu texto vazio.',
      });
    }

    // O modelo cita índices do acervo completo ([4], [12]…). A UI lista só os
    // usados como 1, 2, 3 — renumeramos o texto para bater com essa lista.
    const { resposta: textoAlinhado, citacoes } = alinharCitacoes(texto, opts.trechos);

    return {
      resposta: textoAlinhado,
      citacoes: citacoes.length
        ? citacoes
        : opts.trechos.slice(0, 3).map((t) => ({ slug: t.slug, titulo: t.titulo, fonte: t.fonte })),
      modelo: opts.model,
      tokens: json.usage?.total_tokens ?? null,
    };
  }

  private async linha() {
    const achada = await this.prisma.brainConfig.findUnique({ where: { id: 'brain' } });
    if (achada) return achada;
    return this.prisma.brainConfig.create({ data: { id: 'brain' } });
  }
}

/** Renumerar [n] do acervo para [1]…[K] na ordem da primeira aparição no texto. */
function alinharCitacoes(
  texto: string,
  trechos: ResultadoBusca[],
): { resposta: string; citacoes: { slug: string; titulo: string; fonte: string }[] } {
  const ordem: number[] = [];
  for (const m of texto.matchAll(/\[(\d+)\]/g)) {
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n < 1 || n > trechos.length) continue;
    if (!ordem.includes(n)) ordem.push(n);
  }
  if (!ordem.length) {
    return { resposta: texto, citacoes: [] };
  }

  const mapa = new Map<number, number>();
  ordem.forEach((antigo, i) => mapa.set(antigo, i + 1));

  // Placeholder evita colisão ([12] → [1] enquanto ainda existe [1] antigo).
  let resposta = texto.replace(/\[(\d+)\]/g, (full, dig: string) => {
    const n = Number(dig);
    const novo = mapa.get(n);
    return novo ? `[§${novo}]` : full;
  });
  resposta = resposta.replace(/\[§(\d+)\]/g, '[$1]');

  const citacoes = ordem.map((n) => {
    const t = trechos[n - 1];
    return { slug: t.slug, titulo: t.titulo, fonte: t.fonte };
  });
  return { resposta, citacoes };
}

const FERRAMENTAS_AGENTE = [
  {
    type: 'function',
    function: {
      name: 'buscar_memoria',
      description: 'Busca mais registros na memória institucional (use quando faltar o mês, setor ou número).',
      parameters: {
        type: 'object',
        properties: {
          consulta: { type: 'string', description: 'Consulta curta em português, ex.: vendas da loja em julho 2026' },
        },
        required: ['consulta'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'ler_pagina',
      description: 'Lê o conteúdo completo de uma página cujo slug já apareceu no acervo.',
      parameters: {
        type: 'object',
        properties: {
          slug: { type: 'string', description: 'Slug da página, ex.: loja/receita-2026-07' },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'responder',
      description: 'Encerra: já há fatos suficientes para responder ao usuário.',
      parameters: {
        type: 'object',
        properties: {
          resposta: { type: 'string', description: 'Resposta natural e completa em português' },
          citacoes: {
            type: 'array',
            items: { type: 'number' },
            description: 'Índices [n] dos registros usados',
          },
        },
        required: ['resposta'],
      },
    },
  },
] as const;
