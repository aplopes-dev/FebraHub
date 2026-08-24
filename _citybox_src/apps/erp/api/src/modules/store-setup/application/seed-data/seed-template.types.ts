/**
 * Tipos do template de provisionamento.
 *
 * Todo bloco carrega uma `systemKey`: é ela, e não o id nem o nome, que identifica o
 * registro entre execuções. Nome o usuário renomeia; id muda a cada organização.
 */

export type SeedMovementCategory = {
  systemKey: string;
  code: string;
  name: string;
  type: 'entrada' | 'saida';
};

export type SeedUnitOfMeasure = {
  systemKey: string;
  name: string;
  abbreviation: string;
  kind: 'unit' | 'weight' | 'volume' | 'length' | 'area';
  decimalPlaces: number;
};

export type SeedProductCategory = {
  systemKey: string;
  name: string;
};

export type SeedStock = {
  systemKey: string;
  name: string;
  location: 'proprio' | 'externo' | 'deposito';
  property: 'proprio' | 'terceiro';
  isDefault: boolean;
};

export type SeedFinancialGroup = {
  systemKey: string;
  name: string;
  type: 'receita' | 'despesa';
  /** `resultado` entra na DRE; `patrimonial` fica de fora (caixa e bancos, ativo). */
  classification: 'resultado' | 'patrimonial';
  /** Ordem fixa na árvore da DRE (spec 007-financeiro-ajustes-ui). Ausente = 0. */
  catalogOrder?: number;
  /** Sinal do grupo no Resultado Operacional. Ausente = grupo fora do novo
   *  modelo de 9 categorias (não aparece isolado na árvore reestruturada). */
  sign?: 'positive' | 'negative';
};

export type SeedPaymentMethod = {
  systemKey: string;
  name: string;
  fiscalCode?: string;
  installmentPermission?: string;
};

export type SeedChartOfAccount = {
  systemKey: string;
  name: string;
  /** `systemKey` do grupo financeiro — resolvido para id no momento da gravação. */
  financialGroupKey: string;
  availableForPdv: boolean;
};

export type SeedCostCenter = {
  systemKey: string;
  name: string;
};

export type SeedServiceOrderStatus = {
  systemKey: string;
  name: string;
  baseType: 'open' | 'in_progress' | 'ready' | 'closed' | 'canceled';
  sortOrder: number;
};

export type SeedContractStatus = {
  systemKey: string;
  name: string;
  sortOrder: number;
};

/** Reusa o shape de `SystemPermissionProfileSeed` (fine-to-coarse). */
export type SeedPermissionProfile = {
  systemKey: string;
  name: string;
  description: string;
  /** Só `administrador` vem `true` — demais seedáveis e editáveis. */
  isSystem: boolean;
  permissionIds: string[];
};

export type ErpSeedTemplate = {
  version: number;
  permissionProfiles: readonly SeedPermissionProfile[];
  movementCategories: readonly SeedMovementCategory[];
  unitsOfMeasure: readonly SeedUnitOfMeasure[];
  productCategories: readonly SeedProductCategory[];
  stocks: readonly SeedStock[];
  financialGroups: readonly SeedFinancialGroup[];
  chartOfAccounts: readonly SeedChartOfAccount[];
  costCenters: readonly SeedCostCenter[];
  paymentMethods: readonly SeedPaymentMethod[];
  serviceOrderStatuses: readonly SeedServiceOrderStatus[];
  contractStatuses: readonly SeedContractStatus[];
};
