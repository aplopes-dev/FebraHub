import { Prisma } from '../../../../generated/prisma/client';
import { getTenantScopeState } from '../tenancy/tenant-context';
import { TenantScopeMissingError } from './tenant-scope-missing.error';

/**
 * Models cujo acesso é sempre recortado pela organização, e o campo que
 * carrega o tenant em cada um.
 *
 * `Organization` NÃO entra: ela é o próprio tenant, e o filtro seria circular.
 * `User` também não: a identidade é global e um mesmo usuário pode pertencer a
 * várias organizações.
 *
 * Ao trazer um model novo para a tenancy, acrescente-o aqui — é o que garante
 * que nenhuma query dele escape do recorte.
 */
export const TENANT_SCOPED_MODELS: Readonly<Record<string, string>> = {
  Branch: 'organizationId',
  Membership: 'organizationId',
  BranchAccess: 'organizationId',
  PermissionProfile: 'organizationId',
  Product: 'organizationId',
  ProductCategory: 'organizationId',
  UnitOfMeasure: 'organizationId',
  ProductBranch: 'organizationId',
  Supplier: 'organizationId',
  SupplierBranch: 'organizationId',
  ProductSupplier: 'organizationId',
  Carrier: 'organizationId',
  CarrierBranch: 'organizationId',
  Stock: 'organizationId',
  StockBranch: 'organizationId',
  MovementCategory: 'organizationId',
  MovementCategoryBranch: 'organizationId',
  StockBalance: 'organizationId',
  StockMovement: 'organizationId',
  StockMovementLine: 'organizationId',
  Inventory: 'organizationId',
  InventoryLine: 'organizationId',
  StockTransfer: 'organizationId',
  StockTransferLine: 'organizationId',
  Purchase: 'organizationId',
  PurchaseLine: 'organizationId',
  Variation: 'organizationId',
  VariationOption: 'organizationId',
  ProductVariation: 'organizationId',
  ProductVariationOption: 'organizationId',
  PriceList: 'organizationId',
  PriceListItem: 'organizationId',
  ProductAddon: 'organizationId',
  ProductAddonSettings: 'organizationId',
  ProductAddonLine: 'organizationId',
  ProductSuggestion: 'organizationId',
  ProductFiscal: 'organizationId',
  ProductFiscalBranch: 'organizationId',
  TechnicalSheet: 'organizationId',
  TechnicalSheetComponent: 'organizationId',
  TechnicalSheetOptionComponent: 'organizationId',
  ProductionOrder: 'organizationId',
  ProductionHistoryEntry: 'organizationId',
  CustomerCategory: 'organizationId',
  Customer: 'organizationId',
  CustomerAddress: 'organizationId',
  CustomerBranch: 'organizationId',
  SaleOrder: 'organizationId',
  SaleOrderLine: 'organizationId',
  SaleOrderPayment: 'organizationId',
  ServiceOrder: 'organizationId',
  ServiceOrderStatus: 'organizationId',
  SalesContract: 'organizationId',
  ContractStatus: 'organizationId',
  ContractInstallment: 'organizationId',
  Promotion: 'organizationId',
  BankAccount: 'organizationId',
  FinancialEntry: 'organizationId',
  FinancialGroup: 'organizationId',
  ChartOfAccount: 'organizationId',
  CostCenter: 'organizationId',
  CardContract: 'organizationId',
  CardPaymentMethod: 'organizationId',
  CardRateTier: 'organizationId',
  FinancialEntryPayment: 'organizationId',
  FinancialEntryAllocation: 'organizationId',
  FinancialEntryAttachment: 'organizationId',
  BankTransaction: 'organizationId',
  BankTransfer: 'organizationId',
  StoreSetupLog: 'organizationId',
  PosTerminal: 'organizationId',
  PosCashSession: 'organizationId',
  PosCashMovement: 'organizationId',
  PosDeliveryOrder: 'organizationId',
  PosDeliveryOrderLine: 'organizationId',
  PosPolicy: 'organizationId',
  PosModuleDefaults: 'organizationId',
  BankStatement: 'organizationId',
  BankStatementTransaction: 'organizationId',
  BankStatementMatch: 'organizationId',
  PosFiscalSettings: 'organizationId',
  FiscalGroup: 'organizationId',
  FiscalDefaultTaxes: 'organizationId',
  FiscalGroupUfRate: 'organizationId',
  FiscalAdditionalInfo: 'organizationId',
  NfseIssuance: 'organizationId',
  NfeIssuance: 'organizationId',
  OperationNature: 'organizationId',
  OperationNatureCfopRule: 'organizationId',
  OperationNatureGroupRule: 'organizationId',
};

/** Operações cujo `where` aceita filtro livre. */
const WHERE_OPERATIONS = new Set([
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
]);

/** Operações que gravam e precisam do tenant no `data`. */
const CREATE_OPERATIONS = new Set([
  'create',
  'createMany',
  'createManyAndReturn',
]);

type OperationArgs = {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
};

function withTenantData(
  data: Record<string, unknown> | Record<string, unknown>[] | undefined,
  field: string,
  organizationId: string,
): Record<string, unknown> | Record<string, unknown>[] | undefined {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map((row) => ({ ...row, [field]: organizationId }));
  }
  return { ...data, [field]: organizationId };
}

/**
 * Onde o `organizationId` entra muda com a operação: filtro no `where`, coluna
 * no `data`, e ambos no `upsert` — que consulta e grava na mesma chamada.
 *
 * Exportada para o teste conseguir verificar a injeção sem subir o Prisma.
 */
export function scopeArgs(
  args: OperationArgs,
  operation: string,
  field: string,
  organizationId: string,
): OperationArgs {
  if (operation === 'upsert') {
    return {
      ...args,
      where: { ...(args.where ?? {}), [field]: organizationId },
      create: { ...(args.create ?? {}), [field]: organizationId },
    };
  }

  if (CREATE_OPERATIONS.has(operation)) {
    return {
      ...args,
      data: withTenantData(args.data, field, organizationId),
    };
  }

  if (WHERE_OPERATIONS.has(operation)) {
    return {
      ...args,
      where: { ...(args.where ?? {}), [field]: organizationId },
    };
  }

  return args;
}

/**
 * Camada de acesso a dados da arquitetura multi-empresa: injeta o recorte por
 * organização em toda query dos models da allowlist, lendo o contexto da
 * requisição.
 *
 * É a segunda trava, não a única — os repositórios continuam passando
 * `organizationId` explicitamente. Uma trava de aplicação sobrevive a bug de
 * chamada; esta sobrevive a esquecimento.
 */
export const tenantScopeExtension = Prisma.defineExtension({
  name: 'citybox-tenant-scope',
  query: {
    $allModels: {
      $allOperations({ model, operation, args, query }) {
        const field = model ? TENANT_SCOPED_MODELS[model] : undefined;
        if (!field) return query(args);

        const state = getTenantScopeState();
        if (state.kind === 'absent' || state.kind === 'unscoped') {
          return query(args);
        }
        if (state.kind === 'pending') {
          throw new TenantScopeMissingError(model ?? 'unknown', operation);
        }

        const organizationId = state.context.organizationId;
        const scoped = scopeArgs(args ?? {}, operation, field, organizationId);

        // O cast é a fronteira com a API genérica do Prisma: `args` é a união
        // de todos os tipos de operação de todos os models, e a extensão
        // devolve a mesma forma acrescida de uma coluna.
        return query(scoped);
      },
    },
  },
});
