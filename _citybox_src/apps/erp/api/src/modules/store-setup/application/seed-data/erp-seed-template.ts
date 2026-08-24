import { SYSTEM_PERMISSION_PROFILES } from '../../../../shared/infra/http/permissions/fine-to-coarse';
import { SEED_MOVEMENT_CATEGORIES } from './movement-categories.seed';
import {
  SEED_PRODUCT_CATEGORIES,
  SEED_STOCKS,
  SEED_UNITS_OF_MEASURE,
} from './catalog.seed';
import {
  SEED_CHART_OF_ACCOUNTS,
  SEED_COST_CENTERS,
  SEED_FINANCIAL_GROUPS,
  SEED_PAYMENT_METHODS,
} from './finance.seed';
import {
  SEED_CONTRACT_STATUSES,
  SEED_SERVICE_ORDER_STATUSES,
} from './statuses.seed';
import type { ErpSeedTemplate } from './seed-template.types';

/**
 * Dados que toda organização precisa ter para o ERP funcionar.
 *
 * **Incremente `version` sempre que acrescentar ou alterar um bloco.** É a comparação com
 * `StoreSetupLog.version` que decide quem precisa ser reprovisionado: sem o incremento, as
 * organizações que já rodaram a versão anterior nunca recebem o dado novo — foi exatamente
 * assim que a chave `venda` ficou faltando e o fechamento de pedido passou a dar 404.
 *
 * v2 — perfis de acesso (`SYSTEM_PERMISSION_PROFILES`) + backfill de
 * `membership.permissionProfileId` nulo → `administrador`.
 * v3 — só Administrador fica `isSystem` (não edita/exclui); demais perfis do seed
 * (Financeiro, Gerente, Caixa, Vendedor, Contador, Atendimento) são editáveis.
 * v4 — spec `007-financeiro-ajustes-ui`: 15 formas de pagamento padrão
 * (`paymentMethods`, novo bloco); `financialGroups`/`chartOfAccounts`
 * reestruturados nas 9 categorias fixas da DRE (mesmas `systemKey`s dos 4
 * grupos originais, renomeados — ver `finance.seed.ts` e
 * `scripts/backfill-financial-group-catalog-order.ts` para organizações já
 * provisionadas).
 */
export const ERP_SEED_TEMPLATE: ErpSeedTemplate = Object.freeze({
  version: 4,
  permissionProfiles: SYSTEM_PERMISSION_PROFILES,
  movementCategories: SEED_MOVEMENT_CATEGORIES,
  unitsOfMeasure: SEED_UNITS_OF_MEASURE,
  productCategories: SEED_PRODUCT_CATEGORIES,
  stocks: SEED_STOCKS,
  financialGroups: SEED_FINANCIAL_GROUPS,
  chartOfAccounts: SEED_CHART_OF_ACCOUNTS,
  costCenters: SEED_COST_CENTERS,
  paymentMethods: SEED_PAYMENT_METHODS,
  serviceOrderStatuses: SEED_SERVICE_ORDER_STATUSES,
  contractStatuses: SEED_CONTRACT_STATUSES,
});
