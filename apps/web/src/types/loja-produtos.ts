export interface LojaCategoria {
  id: string;
  nome: string;
  descricao: string;
  cor?: string | null;
  icone?: string | null;
  ordem: number;
  ativo: boolean;
}

export type LojaLocal = "LOJA" | "DEPOSITO";

export interface LojaEstoqueLocal {
  saldoFisico: number;
  reservado: number;
  disponivel: number;
}

export interface LojaProduto {
  id: string;
  nome: string;
  sku?: string | null;
  codigoBarras?: string | null;
  descricao: string;
  imagemUrl?: string | null;
  categoriaId?: string | null;
  categoria?: LojaCategoria | null;
  preco: string;
  custo?: string | null;
  unidade: string;
  produtoEstoqueId?: string | null;
  ativo: boolean;
  vendePdv: boolean;
  exibeCardapio: boolean;
  precisaPreparacao: boolean;
  controlaEstoque: boolean;
  vendeSemEstoque: boolean;
  estoqueMinimo: string;
  ordem: number;
  estoque: {
    porLocal: Record<LojaLocal, LojaEstoqueLocal>;
    saldoTotal: number;
    reservadoTotal: number;
    disponivelTotal: number;
  };
}

export interface LojaMovimento {
  id: string;
  produtoId: string;
  local: LojaLocal;
  tipo: string;
  quantidade: string;
  saldoApos?: string | null;
  origem: string;
  referenciaId?: string | null;
  observacao: string;
  criadoEm: string;
}

export interface LojaIndicadores {
  totalProdutos: number;
  ativos: number;
  categorias: number;
  abaixoMinimo: number;
  porLocal: Array<{ local: LojaLocal; saldoFisico: number; reservado: number }>;
}

export interface ReposicaoItem {
  id: string;
  nome: string;
  sku?: string | null;
  unidade: string;
  categoria?: string | null;
  minimo: number;
  saldoLoja: number;
  saldoDeposito: number;
  saldoTotal: number;
  sugestaoRepor: number;
  podeTransferirDoDeposito: boolean;
}

export interface ReposicaoResposta {
  total: number;
  itens: ReposicaoItem[];
}

export interface ProdutoInput {
  nome: string;
  sku?: string;
  codigoBarras?: string;
  descricao?: string;
  imagemUrl?: string;
  categoriaId?: string | null;
  preco: number;
  custo?: number;
  unidade?: string;
  produtoEstoqueId?: string | null;
  ativo?: boolean;
  vendePdv?: boolean;
  exibeCardapio?: boolean;
  precisaPreparacao?: boolean;
  controlaEstoque?: boolean;
  vendeSemEstoque?: boolean;
  estoqueMinimo?: number;
  ordem?: number;
}
