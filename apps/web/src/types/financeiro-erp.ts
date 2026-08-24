export interface FinContaBancaria { id: string; nome: string; banco: string; saldoInicial: string; ativo: boolean }
export interface FinCentroCusto { id: string; nome: string; sistema: boolean; ativo: boolean }
export interface FinGrupo { id: string; nome: string; tipo: string; classificacao: string; ordem: number; sistema: boolean }
export interface FinPlanoConta { id: string; nome: string; grupoId: string; disponivelPdv: boolean; sistema: boolean }
export interface FinRateio { id: string; planoContaId: string; centroCustoId: string; valor: string; percentual: string; planoConta?: FinPlanoConta; centroCusto?: FinCentroCusto }
export interface FinLancamento {
  id: string; operacao: string; descricao: string; valor: string; juros: string; multa: string; valorPago: string;
  situacao: string; dataCompetencia: string; dataVencimento: string; pagoEm?: string | null;
  contraparte: string; formaPagamento?: string | null; origem: string; observacao: string; criadoEm: string;
  rateios?: FinRateio[]; contaBancaria?: FinContaBancaria | null;
}
export interface FinCadastros { contas: FinContaBancaria[]; centros: FinCentroCusto[]; grupos: FinGrupo[]; planos: FinPlanoConta[] }
export interface FinIndicadores { aReceber: number; aPagar: number; vencidoReceber: number; vencidoPagar: number; caixaRealizado: number }
export interface FinDreConta { conta: string; valor: number }
export interface FinDreLinha { grupo: string; tipo: string; total: number; contas: FinDreConta[] }
export interface FinDre { linhas: FinDreLinha[]; receitas: number; despesas: number; resultado: number }
export interface FinContaSaldo { id: string; nome: string; banco: string; saldoInicial: number; saldoAtual: number }
