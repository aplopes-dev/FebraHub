/* ============================================================
   Tipos do Hub Executivo — espelho dos contratos da API.
   A fonte é apps/api/src/modules/executivo/executivo.types.ts;
   mudou lá, muda aqui.
   ============================================================ */

export type Unidade = "brl" | "qtd" | "pct" | "nota";
export type Direcao = "maior_melhor" | "menor_melhor" | "neutra";
export type NivelStatus = "verde" | "amarelo" | "vermelho" | "neutro" | "cinza";
export type Confianca = "alta" | "media" | "baixa" | "insuficiente";
export type Tendencia = "subindo" | "caindo" | "estavel";

export interface Comparacao {
  base: number;
  delta: number;
  pct: number | null;
  parcial: boolean;
}

export interface ReferenciaMes {
  mes: string;
  valor: number;
}

export interface Comparacoes {
  mesAnterior: Comparacao | null;
  anoAnterior: Comparacao | null;
  media3: Comparacao | null;
  media6: Comparacao | null;
  media12: Comparacao | null;
  melhorMes: ReferenciaMes | null;
  piorMes: ReferenciaMes | null;
}

export interface Projecao {
  central: number;
  faixaMin: number | null;
  faixaMax: number | null;
  confianca: Confianca;
  metodo: string;
}

export interface QualidadeDado {
  fonte: string;
  fonteRotulo: string;
  nivel: "ok" | "atencao" | "critico";
  rotulo: string;
  cobreAte: string | null;
  ultimaSync: string | null;
}

export interface MetaDoCard {
  valor: number;
  origem: "cadastro" | "loja";
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
  tipo: "fluxo" | "estado";
  razao: boolean;
  naVisaoGeral: boolean;
  ordem: number;
  mes: string;
  parcial: boolean;
  valor: number | null;
  quantidade: number | null;
  referencia: string | null;
  meta: MetaDoCard | null;
  pctMeta: number | null;
  esperado: number | null;
  desvioEsperado: number | null;
  reguaEsperado: "historico" | "dias_uteis" | "linear" | null;
  comparacoes: Comparacoes | null;
  tendencia: Tendencia | null;
  projecao: Projecao | null;
  status: { nivel: NivelStatus; rotulo: string };
  texto: string | null;
  serie: { mes: string; valor: number; parcial?: boolean }[] | null;
  qualidade: QualidadeDado;
  cobertura: string | null;
}

export interface Alerta {
  id: string;
  nivel: "vermelho" | "amarelo";
  indicador: string;
  setor: string;
  setorNome: string;
  titulo: string;
  situacao: string;
  impacto: string | null;
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
  qualidade: "ok" | "atencao" | "critico";
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

export interface ColunaDetalhe {
  chave: string;
  nome: string;
  tipo: "texto" | "brl" | "qtd" | "data" | "pct";
}

export interface QuebraDimensao {
  codigo: string;
  nome: string;
  linhas: { rotulo: string; valor: number; quantidade: number | null }[];
}

export interface DetalheIndicador {
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
  metaOrigem: "cadastro" | "loja" | null;
  pontos: PontoRitmo[];
  projecao: Projecao | null;
  reguaEsperado: "historico" | "dias_uteis" | "linear" | null;
}

export interface ProjecaoAnual extends Projecao {
  fechado: number;
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
    melhorMes: ReferenciaMes | null;
    piorMes: ReferenciaMes | null;
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
  metaFonte: "cadastro" | "loja";
  escopo: "mes" | "ano";
  competencia: string;
  valor: number | null;
  origem: "cadastro" | "loja" | null;
  observacao: string | null;
}

export interface PreferenciasHub {
  ordem?: string[];
  ocultos?: string[];
  favoritos?: string[];
  comparacaoPadrao?: string;
  setoresPrioritarios?: string[];
}

export type ModoComparacao =
  | "mes_anterior"
  | "ano_anterior"
  | "media3"
  | "media6"
  | "media12"
  | "melhor";
