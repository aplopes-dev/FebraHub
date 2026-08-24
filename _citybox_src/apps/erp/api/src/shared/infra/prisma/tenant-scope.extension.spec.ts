import { scopeArgs, TENANT_SCOPED_MODELS } from './tenant-scope.extension';
import {
  getTenantScopeState,
  runWithTenantScope,
  runWithoutTenantScope,
  setTenantContext,
  type TenantContext,
} from '../tenancy/tenant-context';

const ORGANIZATION_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ORGANIZATION_ID = '22222222-2222-4222-8222-222222222222';

function makeContext(): TenantContext {
  return {
    organizationId: ORGANIZATION_ID,
    membershipId: '33333333-3333-4333-8333-333333333333',
    role: 'OWNER',
    branchIds: null,
    branchId: null,
    viaPlatformAdmin: false,
    permissionProfileId: null,
    permissionIds: [],
  };
}

describe('tenant scope', () => {
  describe('allowlist', () => {
    it('cobre os models que carregam organizationId', () => {
      expect(TENANT_SCOPED_MODELS).toEqual({
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
      });
    });

    it('não inclui Organization nem User', () => {
      // Organization é o próprio tenant e User é global — filtrá-los seria
      // circular no primeiro caso e errado no segundo.
      expect(TENANT_SCOPED_MODELS).not.toHaveProperty('Organization');
      expect(TENANT_SCOPED_MODELS).not.toHaveProperty('User');
    });
  });

  describe('scopeArgs', () => {
    it('injeta o filtro nas operações de leitura', () => {
      const result = scopeArgs(
        { where: { code: '001' } },
        'findMany',
        'organizationId',
        ORGANIZATION_ID,
      );

      expect(result.where).toEqual({
        code: '001',
        organizationId: ORGANIZATION_ID,
      });
    });

    it('injeta o filtro mesmo quando a chamada não tem where', () => {
      const result = scopeArgs({}, 'count', 'organizationId', ORGANIZATION_ID);

      expect(result.where).toEqual({ organizationId: ORGANIZATION_ID });
    });

    it('sobrescreve um organizationId de outra empresa vindo do chamador', () => {
      // É o caso que a trava existe para pegar: id de outro tenant passado por
      // engano (ou de propósito) não pode vencer o contexto da requisição.
      const result = scopeArgs(
        { where: { organizationId: OTHER_ORGANIZATION_ID } },
        'findFirst',
        'organizationId',
        ORGANIZATION_ID,
      );

      expect(result.where).toEqual({ organizationId: ORGANIZATION_ID });
    });

    it('injeta a coluna no data ao criar', () => {
      const result = scopeArgs(
        { data: { code: '001' } },
        'create',
        'organizationId',
        ORGANIZATION_ID,
      );

      expect(result.data).toEqual({
        code: '001',
        organizationId: ORGANIZATION_ID,
      });
    });

    it('injeta a coluna em cada linha do createMany', () => {
      const result = scopeArgs(
        { data: [{ code: '001' }, { code: '002' }] },
        'createMany',
        'organizationId',
        ORGANIZATION_ID,
      );

      expect(result.data).toEqual([
        { code: '001', organizationId: ORGANIZATION_ID },
        { code: '002', organizationId: ORGANIZATION_ID },
      ]);
    });

    it('injeta no where e no create do upsert', () => {
      const result = scopeArgs(
        { where: { id: 'branch-1' }, create: { code: '001' } },
        'upsert',
        'organizationId',
        ORGANIZATION_ID,
      );

      expect(result.where).toEqual({
        id: 'branch-1',
        organizationId: ORGANIZATION_ID,
      });
      expect(result.create).toEqual({
        code: '001',
        organizationId: ORGANIZATION_ID,
      });
    });
  });

  describe('getTenantScopeState', () => {
    it('é "absent" fora de uma requisição', () => {
      expect(getTenantScopeState()).toEqual({ kind: 'absent' });
    });

    it('é "pending" dentro da requisição antes do guard estabelecer o tenant', () => {
      // "pending" é o estado que faz a query falhar alto em vez de vazar dados
      // de outra empresa.
      runWithTenantScope(() => {
        expect(getTenantScopeState()).toEqual({ kind: 'pending' });
      });
    });

    it('é "unscoped" quando a saída do escopo é declarada', () => {
      runWithTenantScope(() => {
        runWithoutTenantScope(() => {
          expect(getTenantScopeState()).toEqual({ kind: 'unscoped' });
        });
      });
    });

    it('é "active" depois de o contexto ser publicado', () => {
      const context = makeContext();

      runWithTenantScope(() => {
        setTenantContext(context);
        expect(getTenantScopeState()).toEqual({ kind: 'active', context });
      });
    });

    it('volta ao escopo da requisição ao sair de runWithoutTenantScope', () => {
      const context = makeContext();

      runWithTenantScope(() => {
        setTenantContext(context);
        runWithoutTenantScope(() => undefined);
        expect(getTenantScopeState()).toEqual({ kind: 'active', context });
      });
    });
  });
});
