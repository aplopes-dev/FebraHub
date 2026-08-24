export interface PdvTerminal { id: string; nome: string; ativo: boolean }
export interface PdvProduto { produtoId: string; codigo?: string | null; descricao?: string | null; preco: number; saldo: number; reservado: number; disponivel: number }
export interface PdvCaixaMovimento { id: string; tipo: string; valor: string; motivo: string; operadorNome: string; criadoEm: string }
export interface PdvCaixaSessao {
  id: string; terminalId: string; situacao: string; abertoEm: string; fechadoEm?: string | null;
  abertoPorNome: string; fundoAbertura: string; contadoDinheiro?: string | null; esperadoDinheiro?: string | null; diferenca?: string | null;
  terminal?: PdvTerminal; movimentos?: PdvCaixaMovimento[];
}
export interface PdvVendaItem { id: string; produtoId?: string | null; descricao: string; quantidade: string; precoUnit: string; total: string }
export interface PdvVendaPagamento { id: string; formaPagamento: string; valor: string; bandeira?: string | null; parcelas?: number | null }
export interface PdvVenda {
  id: string; numero: string; situacao: string; canal: string; clienteNome: string; operadorNome: string;
  subtotal: string; desconto: string; total: string; observacoes: string; criadoEm: string;
  itens: PdvVendaItem[]; pagamentos: PdvVendaPagamento[]; terminal?: PdvTerminal;
}
export interface PdvIndicadores {
  vendas: number; faturamento: number; ticketMedio: number; vendasHoje: number; faturamentoHoje: number;
  formas: Array<{ forma: string; valor: number }>;
}
export interface PdvResumoSessao {
  sessao: PdvCaixaSessao;
  formas: Array<{ forma: string; valor: number; transacoes: number }>;
  movimentos: PdvCaixaMovimento[];
  esperadoDinheiro: number;
}

// Itens do carrinho (estado local da tela de venda)
export interface ItemCarrinho { produtoId?: string; descricao: string; quantidade: number; precoUnit: number }
