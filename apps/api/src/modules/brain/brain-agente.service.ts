import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import type { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { BrainService, type ResultadoBusca } from './brain.service';
import { SinteseService } from './sintese.service';

const MAX_BUSCAS_EXTRA = 3;
const MAX_PAGINAS = 4;
const LIMITE_ACERVO = 24;

/**
 * Agente da memória institucional.
 *
 * Em vez de uma busca + uma síntese, ele:
 *  1. faz buscas iniciais (pergunta + variações de mês/setor);
 *  2. se houver OpenAI, pode pedir mais buscas ou ler a página inteira;
 *  3. só então redige a resposta — sem "trecho incompleto", sem achismo.
 */
@Injectable()
export class BrainAgenteService {
  private readonly logger = new Logger(BrainAgenteService.name);

  constructor(
    @Inject(forwardRef(() => BrainService))
    private readonly brain: BrainService,
    private readonly sintese: SinteseService,
  ) {}

  async responder(usuario: UsuarioLogado, pergunta: string) {
    const acervo = new Map<string, ResultadoBusca>();
    const incorporar = (lista: ResultadoBusca[]) => {
      for (const item of lista) {
        if (!item.slug) continue;
        const atual = acervo.get(item.slug);
        if (!atual || (item.trecho?.length ?? 0) > (atual.trecho?.length ?? 0)) {
          acervo.set(item.slug, item);
        }
      }
    };

    const consultasIniciais = expandirConsultas(pergunta);
    for (const consulta of consultasIniciais) {
      incorporar(await this.brain.buscar(usuario, consulta, 10));
    }

    if (!acervo.size) {
      return {
        resposta:
          'Não há registro na memória institucional sobre isso nas áreas que você alcança.',
        citacoes: [],
        lacunas: [],
      };
    }

    // Com OpenAI: o modelo pode pedir mais busca / ler página antes de fechar.
    if (await this.sintese.temProvedor()) {
      try {
        await this.rodadaFerramentas(usuario, pergunta, acervo, incorporar);
      } catch (e) {
        this.logger.warn(`agente: ferramentas falharam — ${(e as Error).message}; fechando com o acervo`);
      }
    }

    const trechos = [...acervo.values()]
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, LIMITE_ACERVO);

    const r = await this.sintese.responderFinal(pergunta, trechos);
    return { resposta: r.resposta, citacoes: r.citacoes, lacunas: [] as string[] };
  }

  private async rodadaFerramentas(
    usuario: UsuarioLogado,
    pergunta: string,
    acervo: Map<string, ResultadoBusca>,
    incorporar: (lista: ResultadoBusca[]) => void,
  ) {
    let buscasExtra = 0;
    let paginasLidas = 0;
    const historico: { role: string; content: string }[] = [
      {
        role: 'system',
        content:
          'Você é o agente da memória institucional da Febracis Salvador. ' +
          'Sua missão é reunir fatos da memória e, ao final, chamar a ferramenta "responder". ' +
          'Regras: (1) nunca invente número, nome, meta ou política; ' +
          '(2) se a pergunta citar mês/ano/setor e o acervo não trouxer o fato, use buscar_memoria com outra consulta (ex.: "vendas da loja em julho 2026"); ' +
          '(3) se um título parecer certo mas o trecho for curto, use ler_pagina com o slug; ' +
          '(4) não diga "trecho disponível", "nos trechos", "seria útil registrar" — busque mais ou responda o que há; ' +
          '(5) no máximo algumas ferramentas e depois responda.',
      },
      {
        role: 'user',
        content:
          `Pergunta do usuário: ${pergunta}\n\n` +
          `Acervo atual (já buscado):\n${formatarAcervo([...acervo.values()])}\n\n` +
          'Use ferramentas se precisar. Quando tiver o suficiente, chame "responder".',
      },
    ];

    for (let passo = 0; passo < 5; passo++) {
      const decisoes = await this.sintese.planejarFerramentas(historico);
      if (!decisoes.length) break;

      let respondeu: { resposta: string; indices: number[] } | null = null;
      const observacoes: string[] = [];

      for (const d of decisoes) {
        if (d.nome === 'responder') {
          respondeu = {
            resposta: String(d.args.resposta ?? '').trim(),
            indices: Array.isArray(d.args.citacoes)
              ? d.args.citacoes.map(Number).filter((n) => Number.isFinite(n))
              : [],
          };
          break;
        }
        if (d.nome === 'buscar_memoria' && buscasExtra < MAX_BUSCAS_EXTRA) {
          const consulta = String(d.args.consulta ?? '').trim();
          if (consulta.length >= 3) {
            buscasExtra += 1;
            const achados = await this.brain.buscar(usuario, consulta, 10);
            incorporar(achados);
            observacoes.push(
              `buscar_memoria("${consulta}") → ${achados.length} registro(s): ` +
                achados.slice(0, 5).map((a) => `${a.titulo} [${a.slug}]`).join('; '),
            );
          }
        }
        if (d.nome === 'ler_pagina' && paginasLidas < MAX_PAGINAS) {
          const slug = String(d.args.slug ?? '').trim();
          if (slug) {
            paginasLidas += 1;
            const pagina = await this.brain.lerPagina(usuario, slug);
            if (pagina) {
              incorporar([pagina]);
              observacoes.push(`ler_pagina("${slug}") → ${pagina.titulo} (${pagina.trecho.length} chars)`);
            } else {
              observacoes.push(`ler_pagina("${slug}") → página não encontrada`);
            }
          }
        }
      }

      if (respondeu?.resposta) {
        // Guarda a resposta do agente no acervo só como sinal — o fecho
        // oficial ainda passa por responderFinal para padronizar o tom.
        // Se o agente já trouxe texto bom, preferimos ele quando citar índices válidos.
        const trechos = [...acervo.values()];
        const citacoes = respondeu.indices
          .filter((n) => n >= 1 && n <= trechos.length)
          .map((n) => {
            const t = trechos[n - 1];
            return { slug: t.slug, titulo: t.titulo, fonte: t.fonte };
          });
        // Substitui o fluxo: devolve direto se a resposta parece completa.
        if (respondeu.resposta.length >= 40) {
          // Injeta no historico e deixa responderFinal reescrever a partir do acervo ampliado.
          historico.push({
            role: 'assistant',
            content: respondeu.resposta,
          });
          return;
        }
        if (citacoes.length) {
          /* noop — acervo já está atualizado */
        }
      }

      if (!observacoes.length) break;
      historico.push({
        role: 'assistant',
        content: decisoes.map((d) => `${d.nome}(${JSON.stringify(d.args)})`).join('\n'),
      });
      historico.push({
        role: 'user',
        content:
          `Resultado das ferramentas:\n${observacoes.join('\n')}\n\n` +
          `Acervo atualizado:\n${formatarAcervo([...acervo.values()].slice(0, LIMITE_ACERVO))}\n\n` +
          'Se ainda faltar fato, busque de novo. Caso contrário, chame responder.',
      });
    }
  }
}

/* --------------------------------- consultas -------------------------------- */

const MESES: Record<string, string> = {
  janeiro: '01', fevereiro: '02', marco: '03', março: '03', abril: '04',
  maio: '05', junho: '06', julho: '07', agosto: '08', setembro: '09',
  outubro: '10', novembro: '11', dezembro: '12',
};

const SETORES_PALAVRA: { re: RegExp; termo: string }[] = [
  { re: /\bloja\b|\bpdv\b|\bomie\b|\bestoque\b/i, termo: 'loja' },
  { re: /\bcomercial\b|\bvenda(s)?\b|\branking\b|\bconsultor/i, termo: 'comercial' },
  { re: /\bfinanceir/i, termo: 'financeiro' },
  { re: /\bmarketing\b|\bleads?\b/i, termo: 'marketing' },
  { re: /\bpedag[oó]gic/i, termo: 'pedagógico' },
  { re: /\bevento/i, termo: 'eventos' },
  { re: /\bcrm\b/i, termo: 'crm' },
];

/** Variações determinísticas — baratas e eficazes para mês/setor. */
export function expandirConsultas(pergunta: string): string[] {
  const base = pergunta.trim();
  const out = new Set<string>([base]);
  const lower = base.toLowerCase();

  let mesNome: string | null = null;
  let mesNum: string | null = null;
  for (const [nome, num] of Object.entries(MESES)) {
    if (lower.includes(nome)) {
      mesNome = nome === 'marco' ? 'março' : nome;
      mesNum = num;
      break;
    }
  }
  const ano = lower.match(/\b(20\d{2})\b/)?.[1] ?? null;

  for (const s of SETORES_PALAVRA) {
    if (s.re.test(base)) out.add(s.termo);
  }

  if (mesNome && ano) {
    out.add(`${mesNome} ${ano}`);
    out.add(`vendas da loja em ${mesNome} ${ano}`);
    out.add(`receita ${mesNome} ${ano}`);
    out.add(`loja/receita-${ano}-${mesNum}`);
    out.add(`Vendas da loja em ${mesNome}/${ano}`);
  } else if (mesNome) {
    out.add(`receita ${mesNome}`);
    out.add(`vendas ${mesNome}`);
  }

  if (/\bloja\b/i.test(base)) {
    out.add('receita mensal da loja');
    out.add('retrato da loja');
  }
  if (/\branking\b|\blidera\b|\bquem\b/i.test(base) && /\bcomercial|venda/i.test(base)) {
    out.add('ranking comercial receita');
    out.add('retrato comercial');
  }

  return [...out].slice(0, 6);
}

function formatarAcervo(trechos: ResultadoBusca[]): string {
  return trechos
    .slice(0, LIMITE_ACERVO)
    .map(
      (t, i) =>
        `[${i + 1}] ${t.titulo} (slug: ${t.slug}, área: ${t.fonte})\n${(t.trecho || '').slice(0, 900)}`,
    )
    .join('\n\n');
}
