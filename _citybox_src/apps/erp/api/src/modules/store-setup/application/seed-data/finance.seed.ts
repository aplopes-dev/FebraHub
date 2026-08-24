import type {
  SeedChartOfAccount,
  SeedCostCenter,
  SeedFinancialGroup,
  SeedPaymentMethod,
} from './seed-template.types';

/**
 * Grupos financeiros de resultado (`classification: 'resultado'`) seguem o
 * modelo de 9 categorias fixas da DRE reestruturada — spec
 * `007-financeiro-ajustes-ui`, `data-model.md`. 4 dos 9 são os grupos
 * originais desta feature (`receitas`/`outras-receitas`/`despesas`/`custos`)
 * **reaproveitados** (mesma `systemKey`, nome e `catalogOrder`/`sign` novos) —
 * não duplicados — porque já têm `ChartOfAccount` com lançamentos reais
 * atrelados (ver `research.md` da 007 e o backfill
 * `scripts/backfill-financial-entry-allocations.ts`, que depende das
 * `systemKey`s `outras-receitas`/`despesas`/`outras-despesas` continuarem
 * existindo). Organizações **já provisionadas** antes desta mudança recebem o
 * remapeamento via `scripts/backfill-financial-group-catalog-order.ts`
 * (idempotente, roda uma vez por organização existente); organizações novas
 * já nascem com o modelo novo, direto por este seed.
 *
 * `ChartOfAccount.financialGroupId` é FK obrigatória — sem grupo não há plano de contas.
 */
export const SEED_FINANCIAL_GROUPS: readonly SeedFinancialGroup[] = [
  {
    systemKey: 'receitas',
    name: 'Receitas Operacionais',
    type: 'receita',
    classification: 'resultado',
    catalogOrder: 1,
    sign: 'positive',
  },
  {
    systemKey: 'deducoes-receita',
    name: 'Deduções da Receita',
    type: 'receita',
    classification: 'resultado',
    catalogOrder: 2,
    sign: 'positive',
  },
  {
    systemKey: 'custos',
    name: 'Custos Operacionais',
    type: 'despesa',
    classification: 'resultado',
    catalogOrder: 3,
    sign: 'negative',
  },
  {
    systemKey: 'despesas',
    name: 'Despesas Operacionais',
    type: 'despesa',
    classification: 'resultado',
    catalogOrder: 4,
    sign: 'negative',
  },
  {
    systemKey: 'despesas-financeiras',
    name: 'Despesas Financeiras',
    type: 'despesa',
    classification: 'resultado',
    catalogOrder: 5,
    sign: 'negative',
  },
  {
    systemKey: 'outras-receitas',
    name: 'Outras Receitas',
    type: 'receita',
    classification: 'resultado',
    catalogOrder: 6,
    sign: 'positive',
  },
  {
    systemKey: 'outras-despesas-grupo',
    name: 'Outras Despesas',
    type: 'despesa',
    classification: 'resultado',
    catalogOrder: 7,
    sign: 'negative',
  },
  {
    systemKey: 'descontos-taxas',
    name: 'Descontos/Taxas',
    type: 'despesa',
    classification: 'resultado',
    catalogOrder: 8,
    sign: 'negative',
  },
  {
    systemKey: 'juros-multa',
    name: 'Juros/Multa',
    type: 'despesa',
    classification: 'resultado',
    catalogOrder: 9,
    sign: 'negative',
  },
  {
    // Patrimonial: sangria/suprimento de caixa não são resultado do período — ver
    // specs/erp/003-financial-reports-cost-center/research.md D2.
    systemKey: 'caixa-e-bancos',
    name: 'Caixa e bancos',
    type: 'receita',
    classification: 'patrimonial',
  },
  {
    // Patrimonial: recebimento de cliente é liquidação de um ativo já reconhecido, não
    // receita nova — mesma nota de D2.
    systemKey: 'ativo',
    name: 'Ativo',
    type: 'receita',
    classification: 'patrimonial',
  },
] as const;

/**
 * As contas com `availableForPdv` são as que o caixa oferece na tela de sangria, suprimento
 * e recebimento — sem elas o PDV abre sem nenhuma opção de classificação.
 *
 * Subcategorias do novo modelo da DRE (Receitas Operacionais e Juros/Multa) —
 * ver `007-financeiro-ajustes-ui/data-model.md`. As demais 7 categorias do
 * modelo não têm subconta fixa: o grupo aparece na árvore como folha.
 */
export const SEED_CHART_OF_ACCOUNTS: readonly SeedChartOfAccount[] = [
  {
    systemKey: 'vendas-mercadorias',
    name: 'Faturamento com venda de produtos',
    financialGroupKey: 'receitas',
    availableForPdv: true,
  },
  {
    systemKey: 'prestacao-servicos',
    name: 'Faturamento com serviços',
    financialGroupKey: 'receitas',
    availableForPdv: true,
  },
  {
    systemKey: 'faturamento-servicos-produtos',
    name: 'Faturamento com serviços/venda de produtos',
    financialGroupKey: 'receitas',
    availableForPdv: false,
  },
  {
    systemKey: 'outras-receitas',
    name: 'Outras receitas',
    financialGroupKey: 'outras-receitas',
    availableForPdv: false,
  },
  {
    systemKey: 'cmv',
    name: 'Custo das mercadorias vendidas',
    financialGroupKey: 'custos',
    availableForPdv: false,
  },
  {
    systemKey: 'despesas-pessoal',
    name: 'Despesas com pessoal',
    financialGroupKey: 'despesas',
    availableForPdv: false,
  },
  {
    systemKey: 'despesas-administrativas',
    name: 'Despesas administrativas',
    financialGroupKey: 'despesas',
    availableForPdv: false,
  },
  {
    // Fallback do backfill de lançamentos financeiros legados sem rateio por categoria
    // (categoryName solta que não bate com nenhuma conta) — ver research.md D7/D9 da
    // feature de Lançamentos financeiros. `systemKey` estável mantida (não renomeada)
    // porque `scripts/backfill-financial-entry-allocations.ts` a resolve por esse
    // valor; só o grupo pai mudou (de `despesas` para o novo `outras-despesas-grupo`,
    // que reflete melhor o modelo da DRE — "Outras despesas" não é a mesma coisa que
    // "Despesas Operacionais").
    systemKey: 'outras-despesas',
    name: 'Outras despesas',
    financialGroupKey: 'outras-despesas-grupo',
    availableForPdv: false,
  },
  {
    systemKey: 'juros-multa-receitas',
    name: 'Juros/Multa de Receitas',
    financialGroupKey: 'juros-multa',
    availableForPdv: false,
  },
  {
    systemKey: 'juros-multa-despesas',
    name: 'Juros/Multa de Despesas',
    financialGroupKey: 'juros-multa',
    availableForPdv: false,
  },
  {
    systemKey: 'sangria',
    name: 'Sangria de caixa',
    financialGroupKey: 'caixa-e-bancos',
    availableForPdv: true,
  },
  {
    systemKey: 'suprimento',
    name: 'Suprimento de caixa',
    financialGroupKey: 'caixa-e-bancos',
    availableForPdv: true,
  },
  {
    systemKey: 'recebimento-clientes',
    name: 'Recebimento de clientes',
    financialGroupKey: 'ativo',
    availableForPdv: true,
  },
] as const;

export const SEED_COST_CENTERS: readonly SeedCostCenter[] = [
  { systemKey: 'administrativo', name: 'Administrativo' },
  { systemKey: 'comercial', name: 'Comercial' },
  { systemKey: 'financeiro', name: 'Financeiro' },
  { systemKey: 'operacional', name: 'Operacional' },
  { systemKey: 'marketing', name: 'Marketing' },
] as const;

/**
 * As 15 formas de pagamento padrão da plataforma — spec
 * `007-financeiro-ajustes-ui`, FR-018. `systemKey`s espelham os ids do mock
 * anterior (`features/payment-methods/data/mock-payment-methods.ts`,
 * `pm-*`) só por rastreabilidade histórica — não há mais leitura desse mock.
 * `fiscalCode` = tabela `tPag` da NF-e (NT 2023.004).
 */
export const SEED_PAYMENT_METHODS: readonly SeedPaymentMethod[] = [
  { systemKey: 'pm-dinheiro', name: 'Dinheiro', fiscalCode: '01' },
  { systemKey: 'pm-cheque', name: 'Cheque', fiscalCode: '02' },
  {
    systemKey: 'pm-cartao',
    name: 'Cartão de Crédito',
    fiscalCode: '03',
    installmentPermission: 'allowed',
  },
  { systemKey: 'pm-cartao-debito', name: 'Cartão de Débito', fiscalCode: '04' },
  { systemKey: 'pm-boleto', name: 'Boleto', fiscalCode: '15' },
  { systemKey: 'pm-deposito', name: 'Depósito', fiscalCode: '16' },
  { systemKey: 'pm-pagseguro', name: 'PagSeguro', fiscalCode: '99' },
  {
    systemKey: 'pm-debito-em-conta',
    name: 'Débito em Conta',
    fiscalCode: '99',
  },
  {
    systemKey: 'pm-vale-alimentacao',
    name: 'Vale Alimentação',
    fiscalCode: '10',
  },
  { systemKey: 'pm-vale-refeicao', name: 'Vale Refeição', fiscalCode: '11' },
  { systemKey: 'pm-vale-presente', name: 'Vale Presente', fiscalCode: '12' },
  {
    systemKey: 'pm-credito-em-loja',
    name: 'Crédito em Loja',
    fiscalCode: '21',
  },
  {
    systemKey: 'pm-faturamento',
    name: 'Faturamento',
    fiscalCode: '14',
    installmentPermission: 'allowed',
  },
  {
    systemKey: 'pm-pontos-fidelidade',
    name: 'Pontos de Fidelidade',
    fiscalCode: '19',
  },
  { systemKey: 'pm-pix', name: 'PIX', fiscalCode: '17' },
] as const;
