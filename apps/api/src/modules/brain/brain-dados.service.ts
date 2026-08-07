import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import type { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { PERMISSOES } from '../permissoes/catalogo';
import { ExecutivoService } from '../executivo/executivo.service';
import { BrainService, FONTES_SETOR, FONTE_GERAL } from './brain.service';
import { GbrainCliente } from './gbrain.cliente';

/**
 * O QUE O GBRAIN SABE DO SISTEMA.
 *
 * Sozinho, o gbrain só conhece o que foi escrito nele: documento enviado e
 * página registrada. Ele não lê o banco do FebraHub — nem deveria, porque a
 * pergunta que ele responde ("qual é a política de desconto?") não é a mesma
 * que uma view responde ("quanto vendemos em julho?").
 *
 * A ponte é esta: uma vez por dia (e sob demanda no botão da tela) os
 * indicadores do Hub Executivo viram TEXTO — uma página por setor, na fonte
 * daquele setor. Assim "quantas matrículas fechamos em julho?" passa a ter
 * resposta, e ela chega com a mesma trava de acesso do resto: a página do
 * financeiro está na fonte `financeiro`, e quem não alcança o financeiro
 * nunca a recebe.
 *
 * Por que texto e não uma consulta ao vivo: o valor do brain é relacionar
 * número com contexto ("a queda de junho bateu com a mudança de política").
 * Isso só existe se o número estiver indexado ao lado do documento.
 */
@Injectable()
export class BrainDadosService {
  private readonly logger = new Logger(BrainDadosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brain: BrainService,
    private readonly executivo: ExecutivoService,
    private readonly gbrain: GbrainCliente,
  ) {}

  /**
   * Publica o retrato do mês. `autor` é quem disparou (para a auditoria da
   * página); a leitura dos indicadores usa um contexto de serviço com acesso
   * total, porque a separação por setor acontece na ESCRITA — cada página vai
   * para a fonte do seu setor.
   */
  async sincronizar(autor: UsuarioLogado) {
    if (!(await this.gbrain.saudavel())) {
      return { publicadas: 0, motivo: 'A memória institucional está fora do ar.' };
    }

    const servico = contextoDeServico();
    const resumo = await this.executivo.resumo(servico);

    const porSetor = new Map<string, typeof resumo.cards>();
    for (const card of resumo.cards) {
      const fonte = (FONTES_SETOR as readonly string[]).includes(card.setor)
        ? card.setor
        : FONTE_GERAL;
      const lista = porSetor.get(fonte) ?? [];
      lista.push(card);
      porSetor.set(fonte, lista);
    }

    let publicadas = 0;
    for (const [fonte, cards] of porSetor) {
      const alertas = resumo.alertas.filter(
        (a) => a.setor === fonte || (fonte === FONTE_GERAL && !(FONTES_SETOR as readonly string[]).includes(a.setor)),
      );
      const texto = paginaDoSetor(fonte, resumo.referencia.mes, cards, alertas);
      // Slug FIXO por setor e competência: rodar de novo no mesmo mês
      // atualiza a página em vez de criar uma cópia. É o que permite o cron
      // diário sem inchar a base.
      const slug = `${fonte}/indicadores-${resumo.referencia.mes.slice(0, 7)}`;
      // Credencial DA FONTE: o gbrain grava na fonte do grant, não no que o
      // corpo pedir. É o que garante que a página do financeiro nasça mesmo
      // dentro do financeiro.
      const credencial = await this.brain.credencialDeServico(fonte);
      await this.gbrain
        .operacao(credencial, 'put_page', {
          slug,
          title: `Indicadores de ${nomeDoSetor(fonte)} — ${competenciaLegivel(resumo.referencia.mes)}`,
          content: texto,
        })
        .then(() => {
          publicadas += 1;
        })
        .catch((e: Error) => this.logger.warn(`brain: falha ao publicar ${slug}: ${e.message}`));
    }

    // Quem faz o quê: o organograma responde "com quem eu falo sobre X",
    // que é das perguntas mais comuns e hoje mora só numa tela.
    const membros = await this.prisma.orgMembro.findMany({
      where: { ativo: true },
      orderBy: [{ setor: 'asc' }, { ordem: 'asc' }, { nome: 'asc' }],
    });
    if (membros.length) {
      const credencialGeral = await this.brain.credencialDeServico(FONTE_GERAL);
      await this.gbrain
        .operacao(credencialGeral, 'put_page', {
          slug: `${FONTE_GERAL}/organograma`,
          title: 'Organograma — quem faz o quê',
          content: paginaDoOrganograma(membros),
        })
        .then(() => {
          publicadas += 1;
        })
        .catch((e: Error) => this.logger.warn(`brain: falha ao publicar o organograma: ${e.message}`));
    }

    this.logger.log(`brain: ${publicadas} página(s) de dados publicada(s) por ${autor.email}`);
    return { publicadas, competencia: resumo.referencia.mes };
  }

  /**
   * 4h05 — depois dos ETLs da madrugada e antes de alguém chegar. Falha em
   * silêncio de propósito: brain fora do ar não pode derrubar a API.
   */
  @Cron('5 4 * * *', { timeZone: 'America/Bahia' })
  async sincronizarDiariamente(): Promise<void> {
    try {
      const r = await this.sincronizar(contextoDeServico());
      this.logger.log(`brain: sincronização diária publicou ${r.publicadas} página(s)`);
    } catch (e) {
      this.logger.warn(`brain: sincronização diária falhou — ${(e as Error).message}`);
    }
  }
}

/* --------------------------------- textos --------------------------------- */

const NOMES: Record<string, string> = {
  geral: 'Geral',
  comercial: 'Comercial',
  financeiro: 'Financeiro',
  marketing: 'Marketing',
  pedagogico: 'Pedagógico',
  eventos: 'Eventos',
  loja: 'Loja',
  estoque: 'Estoque',
  crm: 'CRM',
};

const nomeDoSetor = (f: string) => NOMES[f] ?? f;

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function competenciaLegivel(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${MESES[Number(m) - 1] ?? m}/${ano}`;
}

/** Número em português, com a unidade do indicador. */
function valorLegivel(valor: number | null, unidade: string): string {
  if (valor === null || !Number.isFinite(valor)) return 'sem dado';
  if (unidade === 'moeda') {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  }
  if (unidade === 'percentual') return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

/**
 * Markdown em PROSA, não tabela crua. O que o gbrain indexa e cita é texto —
 * uma linha de tabela isolada num chunk perde o sujeito ("R$ 128.400" sem
 * dizer de quê, de quando, de qual setor).
 */
function paginaDoSetor(
  fonte: string,
  mes: string,
  cards: { nome: string; valor: number | null; quantidade: number | null; unidade: string; parcial: boolean; descricao: string }[],
  alertas: { titulo: string; situacao: string; nivel: string }[],
): string {
  const competencia = competenciaLegivel(mes);
  const linhas: string[] = [
    `# Indicadores de ${nomeDoSetor(fonte)} — ${competencia}`,
    '',
    `Retrato dos números do setor ${nomeDoSetor(fonte)} na competência de ${competencia},`,
    'extraído do Hub Executivo do FebraHub.',
    '',
  ];

  for (const c of cards) {
    const parcial = c.parcial ? ' (mês em curso, número parcial)' : '';
    const qtd = c.quantidade !== null ? ` sobre ${c.quantidade.toLocaleString('pt-BR')} registro(s)` : '';
    linhas.push(
      `- **${c.nome}** em ${competencia}: ${valorLegivel(c.valor, c.unidade)}${qtd}${parcial}.` +
        (c.descricao ? ` ${c.descricao}` : ''),
    );
  }

  if (alertas.length) {
    linhas.push('', '## Alertas do período', '');
    for (const a of alertas) {
      linhas.push(`- **${a.titulo}** (${a.nivel}): ${a.situacao}`);
    }
  }

  linhas.push(
    '',
    '---',
    'Página gerada automaticamente pelo FebraHub a partir do Hub Executivo.',
    'É reescrita a cada sincronização da mesma competência.',
  );
  return linhas.join('\n');
}

function paginaDoOrganograma(
  membros: { tipo: string; nome: string; funcao: string; setor: string }[],
): string {
  const linhas: string[] = [
    '# Organograma — quem faz o quê',
    '',
    'Quem responde por cada função em cada setor da Febracis Salvador,',
    'incluindo os agentes de IA em operação.',
    '',
  ];
  const porSetor = new Map<string, typeof membros>();
  for (const m of membros) {
    const lista = porSetor.get(m.setor) ?? [];
    lista.push(m);
    porSetor.set(m.setor, lista);
  }
  for (const [setor, lista] of porSetor) {
    linhas.push(`## ${nomeDoSetor(setor)}`, '');
    for (const m of lista) {
      const papel = m.tipo === 'agente' ? 'agente de IA' : 'funcionário';
      linhas.push(`- **${m.nome}** — ${m.funcao} (${papel}, setor ${nomeDoSetor(setor)}).`);
    }
    linhas.push('');
  }
  linhas.push('---', 'Página gerada automaticamente pelo FebraHub a partir do painel Organograma.');
  return linhas.join('\n');
}

/**
 * Identidade de serviço para LER o sistema inteiro. Não abre porta nenhuma:
 * ela existe só dentro deste service, nunca sai numa resposta HTTP, e o
 * recorte de quem VAI LER cada página acontece na fonte em que ela é gravada.
 */
function contextoDeServico(): UsuarioLogado {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'sistema@febrahub',
    nome: 'FebraHub',
    papel: 'admin',
    setor: 'geral',
    setores: ['geral'],
    permissoes: [...PERMISSOES],
    perfilAcesso: null,
  };
}
