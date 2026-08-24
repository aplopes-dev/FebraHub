import { ERP_SEED_TEMPLATE } from './erp-seed-template';

/**
 * Nenhum use case procura mais categoria de movimentação por `systemKey`: o motivo dos
 * fluxos automáticos virou o enum `StockMovementReason`, derivado de `(sourceType, type)`.
 * As categorias abaixo sobrevivem como sugestão de partida para o lançamento manual, por
 * isso o teste que exigia chaves específicas saiu daqui.
 */
describe('ERP_SEED_TEMPLATE', () => {
  it('não repete systemKey dentro de um mesmo bloco', () => {
    const blocks = [
      ERP_SEED_TEMPLATE.permissionProfiles,
      ERP_SEED_TEMPLATE.movementCategories,
      ERP_SEED_TEMPLATE.unitsOfMeasure,
      ERP_SEED_TEMPLATE.productCategories,
      ERP_SEED_TEMPLATE.stocks,
      ERP_SEED_TEMPLATE.financialGroups,
      ERP_SEED_TEMPLATE.chartOfAccounts,
      ERP_SEED_TEMPLATE.costCenters,
      ERP_SEED_TEMPLATE.paymentMethods,
      ERP_SEED_TEMPLATE.serviceOrderStatuses,
      ERP_SEED_TEMPLATE.contractStatuses,
    ];

    for (const block of blocks) {
      const keys = block.map((item) => item.systemKey);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('não repete código de categoria de movimentação', () => {
    const codes = ERP_SEED_TEMPLATE.movementCategories.map((c) => c.code);

    expect(new Set(codes).size).toBe(codes.length);
  });

  it('aponta todas as contas contábeis para um grupo financeiro existente', () => {
    const groupKeys = new Set(
      ERP_SEED_TEMPLATE.financialGroups.map((group) => group.systemKey),
    );

    for (const account of ERP_SEED_TEMPLATE.chartOfAccounts) {
      expect(groupKeys.has(account.financialGroupKey)).toBe(true);
    }
  });

  it('tem exatamente um depósito padrão', () => {
    const defaults = ERP_SEED_TEMPLATE.stocks.filter(
      (stock) => stock.isDefault,
    );

    expect(defaults).toHaveLength(1);
  });

  it('tem exatamente as 15 formas de pagamento padrão da plataforma (spec 007)', () => {
    expect(ERP_SEED_TEMPLATE.paymentMethods).toHaveLength(15);
  });

  it('tem exatamente as 9 categorias de resultado da DRE reestruturada, com catalogOrder único (spec 007)', () => {
    const resultGroups = ERP_SEED_TEMPLATE.financialGroups.filter(
      (group) => group.classification === 'resultado',
    );
    expect(resultGroups).toHaveLength(9);

    const orders = resultGroups.map((group) => group.catalogOrder);
    expect(new Set(orders).size).toBe(orders.length);
    expect(resultGroups.every((group) => group.sign !== undefined)).toBe(true);
  });
});
