/**
 * Contratos de resposta do Hub Executivo — o que o front consome.
 * O espelho deles no front é apps/web/src/types/executivo.ts; mudou aqui,
 * muda lá.
 */
import type {
  Comparacoes,
  Confianca,
  Direcao,
  NivelStatus,
  PontoMensal,
  Projecao,
  ProjecaoAnual,
  Tendencia,
} from './calculos';
import type { ColunaDetalhe, Unidade } from './indicadores';

export interface QualidadeDado {
  fonte: string;
  fonteRotulo: string;
  /** 'ok' | 'atencao' | 'critico' — semáforo da CONFIANÇA no dado, não do KPI. */
  nivel: 'ok' | 'atencao' | 'critico';
  /** "Atualizado hoje", "Dados até 13/07 — fonte não conectada"... */
  rotulo: string;
  cobreAte: string | null;
  ultimaSync: string | null;
}

export interface MetaDoCard {
  valor: number;
  /** De onde a meta veio: cadastro próprio ou planilha oficial da loja. */
  origem: 'cadastro' | 'loja';
  /** Só a loja tem três níveis; os demais ficam null. */
  niveis?: { minima: number | null; basica: number | null; master: number | null };
}

export interface CardIndicador {
  codigo: string;
  nome: string;
  curto: string;
  descricao: string;
  setor: string;
  setorNome: string;
  unidade: Unidade;
  direcao: Direcao;
  tipo: 'fluxo' | 'estado';
  razao: boolean;
  naVisaoGeral: boolean;
  ordem: number;

  /** Mês de referência do card (YYYY-MM-01); estado ignora. */
  mes: string;
  /** true = mês em curso, número parcial. */
  parcial: boolean;
  valor: number | null;
  /** Qtde de registros por trás do valor (quando faz sentido). */
  quantidade: number | null;
  /** Data da fotografia, nos indicadores de estado. */
  referencia: string | null;

  meta: MetaDoCard | null;
  pctMeta: number | null;
  esperado: number | null;
  desvioEsperado: number | null;
  /** Como o esperado foi calculado (histórico / dias úteis / linear). */
  reguaEsperado: 'historico' | 'dias_uteis' | 'linear' | null;

  comparacoes: Comparacoes | null;
  tendencia: Tendencia | null;
  projecao: Projecao | null;
  status: { nivel: NivelStatus; rotulo: string };
  texto: string | null;
  /** Últimos 13 meses (fechados + parcial marcado) para o spark. */
  serie: { mes: string; valor: number; parcial?: boolean }[] | null;
  qualidade: QualidadeDado;
  cobertura: string | null;
}

export interface Alerta {
  id: string;
  nivel: 'vermelho' | 'amarelo';
  indicador: string;
  setor: string;
  setorNome: string;
  titulo: string;
  /** A situação em uma frase, com os números. */
  situacao: string;
  impacto: string | null;
  /** "Possíveis fatores a investigar" — calculados, nunca inventados. */
  fatores: string[];
  acaoSugerida: string | null;
}

export interface Destaque {
  indicador: string;
  setor: string;
  setorNome: string;
  titulo: string;
  frase: string;
}

export interface BlocoSetor {
  setor: string;
  nome: string;
  indicadores: string[];
  alertas: number;
  destaques: number;
  /** Pior nível de qualidade das fontes do setor. */
  qualidade: 'ok' | 'atencao' | 'critico';
}

export interface FonteResumo {
  fonte: string;
  nome: string;
  status: string;
  rotulo: string;
  ultimaSync: string | null;
}

export interface ResumoExecutivo {
  referencia: {
    hoje: string;
    mes: string;
    mesCorrente: string;
    parcial: boolean;
    diaAtual: number;
    diasNoMes: number;
  };
  cards: CardIndicador[];
  alertas: Alerta[];
  destaques: Destaque[];
  setores: BlocoSetor[];
  fontes: FonteResumo[];
  geradoEm: string;
}

export interface QuebraDimensao {
  codigo: string;
  nome: string;
  linhas: { rotulo: string; valor: number; quantidade: number | null }[];
}

export interface DetalheIndicadorResposta {
  card: CardIndicador;
  formula: string;
  fonteTabela: string;
  serieCompleta: { mes: string; valor: number; parcial?: boolean }[];
  quebras: QuebraDimensao[];
  periodo: { de: string; ate: string };
  temTabela: boolean;
  colunas: ColunaDetalhe[] | null;
}

export interface TabelaDetalhe {
  colunas: ColunaDetalhe[];
  linhas: Record<string, unknown>[];
  pagina: number;
  porPagina: number;
  total: number;
  soma: number | null;
}

export interface PontoRitmo {
  dia: string;
  realizado: number | null;
  esperado: number | null;
  projetado: number | null;
  faixaMin: number | null;
  faixaMax: number | null;
}

export interface RitmoMeta {
  codigo: string;
  mes: string;
  parcial: boolean;
  hoje: string | null;
  meta: number | null;
  metaOrigem: 'cadastro' | 'loja' | null;
  pontos: PontoRitmo[];
  projecao: Projecao | null;
  reguaEsperado: 'historico' | 'dias_uteis' | 'linear' | null;
}

export interface AnualIndicador {
  codigo: string;
  nome: string;
  unidade: Unidade;
  linhas: {
    ano: number;
    total: number;
    mesesComDado: number;
    completo: boolean;
    mediaMensal: number;
    variacaoAnoAnterior: number | null;
    variacaoPeriodoEquivalente: number | null;
    melhorMes: PontoMensal | null;
    piorMes: PontoMensal | null;
    metaAno: number | null;
  }[];
  projecaoAnoCorrente: ProjecaoAnual | null;
  serieMensal: { mes: string; valor: number; parcial?: boolean }[];
}

export interface MetaLinha {
  indicador: string;
  nome: string;
  setor: string;
  setorNome: string;
  unidade: Unidade;
  metaFonte: 'cadastro' | 'loja';
  escopo: 'mes' | 'ano';
  competencia: string;
  valor: number | null;
  origem: 'cadastro' | 'loja' | null;
  observacao: string | null;
}

export interface PreferenciasHub {
  ordem?: string[];
  ocultos?: string[];
  favoritos?: string[];
  comparacaoPadrao?: string;
  setoresPrioritarios?: string[];
}

export type { Comparacoes, Confianca, Projecao, ProjecaoAnual };
