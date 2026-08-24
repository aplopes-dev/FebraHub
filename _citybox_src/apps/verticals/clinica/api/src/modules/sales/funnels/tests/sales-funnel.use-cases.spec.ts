import { SalesFunnelDefaultFrozenError } from '../domain/errors/sales-funnel-default-frozen.error';
import { SalesFunnelStageHasOpportunitiesError } from '../domain/errors/sales-funnel-stage-has-opportunities.error';
import { createSalesFunnelTestHarness } from './sales-funnel-test.fixtures';

describe('SalesFunnel use cases', () => {
  const storeId = 'store-1';

  it('creates funnel with default stages', async () => {
    const harness = createSalesFunnelTestHarness();
    const funnel = await harness.create.execute({
      storeId,
      name: 'Meu funil',
    });

    expect(funnel.stages).toHaveLength(4);
    expect(funnel.stages.map((s) => s.type)).toEqual([
      'others',
      'others',
      'won',
      'lost',
    ]);
    expect(funnel.stages.find((s) => s.type === 'won')?.order).toBe(998);
  });

  it('ensure-defaults is idempotent', async () => {
    const harness = createSalesFunnelTestHarness();

    const first = await harness.ensureDefaults.execute({ storeId });
    expect(first.created).toBe(true);
    expect(first.funnels).toHaveLength(2);

    const second = await harness.ensureDefaults.execute({ storeId });
    expect(second.created).toBe(false);
    expect(second.funnels).toHaveLength(2);
  });

  it('rejects deleting default funnel', async () => {
    const harness = createSalesFunnelTestHarness();
    const ensured = await harness.ensureDefaults.execute({ storeId });
    const defaultId = ensured.funnels[0].id;

    await expect(
      harness.delete.execute({ storeId, id: defaultId }),
    ).rejects.toBeInstanceOf(SalesFunnelDefaultFrozenError);
  });

  it('rejects removing stage with opportunities', async () => {
    const harness = createSalesFunnelTestHarness();
    const funnel = await harness.create.execute({
      storeId,
      name: 'Custom',
    });
    const openStage = funnel.stages.find((s) => s.order === 0)!;
    harness.repo.seedOpportunityCount(openStage.id, 2);

    await expect(
      harness.update.execute({
        storeId,
        id: funnel.id,
        stages: funnel.stages
          .filter((s) => s.id !== openStage.id)
          .map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            color: s.color,
            order: s.order,
          })),
      }),
    ).rejects.toBeInstanceOf(SalesFunnelStageHasOpportunitiesError);
  });

  it('reorders movable stages without colliding on unique order', async () => {
    const harness = createSalesFunnelTestHarness();
    const funnel = await harness.create.execute({
      storeId,
      name: 'Reorder',
    });
    const movable = funnel.stages.filter((s) => s.type === 'others');
    expect(movable).toHaveLength(2);

    const [first, second] = movable;
    const won = funnel.stages.find((s) => s.type === 'won')!;
    const lost = funnel.stages.find((s) => s.type === 'lost')!;

    const updated = await harness.update.execute({
      storeId,
      id: funnel.id,
      stages: [
        {
          id: second.id,
          name: second.name,
          type: second.type,
          color: second.color,
          order: 0,
        },
        {
          id: first.id,
          name: first.name,
          type: first.type,
          color: first.color,
          order: 1,
        },
        {
          id: won.id,
          name: won.name,
          type: won.type,
          color: won.color,
          order: 998,
        },
        {
          id: lost.id,
          name: lost.name,
          type: lost.type,
          color: lost.color,
          order: 999,
        },
      ],
    });

    const others = updated.stages.filter((s) => s.type === 'others');
    expect(others.map((s) => s.id)).toEqual([second.id, first.id]);
    expect(others.map((s) => s.order)).toEqual([0, 1]);
    expect(updated.stages.find((s) => s.type === 'won')?.order).toBe(998);
    expect(updated.stages.find((s) => s.type === 'lost')?.order).toBe(999);
  });
});
