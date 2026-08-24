import { SalesOpportunityFrozenError } from '../domain/errors/sales-opportunity-frozen.error';
import {
  createSalesOpportunityTestHarness,
  TEST_ACTOR,
} from './sales-opportunity-test.fixtures';

describe('SalesOpportunity use cases', () => {
  const storeId = 'store-1';

  async function seedFunnel() {
    const harness = createSalesOpportunityTestHarness();
    const funnel = await harness.createFunnel.execute({
      storeId,
      name: 'Funil teste',
    });
    return { harness, funnel };
  }

  it('creates opportunity with history and lists with search', async () => {
    const { harness, funnel } = await seedFunnel();
    const openStage = funnel.stages[0];

    const created = await harness.create.execute({
      storeId,
      funnelId: funnel.id,
      stageId: openStage.id,
      title: 'Consulta avaliação',
      phone: '(73) 99999-1111',
      origin: 'instagram',
      actor: TEST_ACTOR,
    });

    expect(created.phone).toBe('73999991111');
    expect(created.stageId).toBe(openStage.id);
    expect(created.sortOrder).toBe(0);

    const history = await harness.history.execute({
      storeId,
      opportunityId: created.id,
    });
    expect(history).toHaveLength(1);
    expect(history[0].actionType).toBe('created');

    const listed = await harness.list.execute({
      storeId,
      funnelId: funnel.id,
      search: 'avaliação',
    });
    expect(listed.total).toBe(1);
    expect(listed.items[0].id).toBe(created.id);
  });

  it('reorders opportunities within a stage and lists by sortOrder', async () => {
    const { harness, funnel } = await seedFunnel();
    const openStage = funnel.stages[0];

    const first = await harness.create.execute({
      storeId,
      funnelId: funnel.id,
      stageId: openStage.id,
      title: 'Primeira',
      actor: TEST_ACTOR,
    });
    const second = await harness.create.execute({
      storeId,
      funnelId: funnel.id,
      stageId: openStage.id,
      title: 'Segunda',
      actor: TEST_ACTOR,
    });
    expect(first.sortOrder).toBe(0);
    expect(second.sortOrder).toBe(1);

    await harness.reorder.execute({
      storeId,
      items: [
        { id: second.id, stageId: openStage.id, sortOrder: 0 },
        { id: first.id, stageId: openStage.id, sortOrder: 1 },
      ],
    });

    const listed = await harness.list.execute({
      storeId,
      funnelId: funnel.id,
      stageId: openStage.id,
    });
    expect(listed.items.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(listed.items.map((item) => item.sortOrder)).toEqual([0, 1]);
  });

  it('moves opportunity and freezes when won', async () => {
    const { harness, funnel } = await seedFunnel();
    const openStage = funnel.stages[0];
    const wonStage = funnel.stages.find((s) => s.type === 'won')!;

    const created = await harness.create.execute({
      storeId,
      funnelId: funnel.id,
      stageId: openStage.id,
      title: 'Lead',
      actor: TEST_ACTOR,
    });

    const moved = await harness.move.execute({
      storeId,
      id: created.id,
      stageId: wonStage.id,
      actor: TEST_ACTOR,
    });
    expect(moved.stageId).toBe(wonStage.id);
    expect(moved.isTerminal).toBe(true);

    const history = await harness.history.execute({
      storeId,
      opportunityId: created.id,
    });
    expect(history.some((h) => h.actionType === 'moved')).toBe(true);

    await expect(
      harness.update.execute({
        storeId,
        id: created.id,
        title: 'Não deve',
        actor: TEST_ACTOR,
      }),
    ).rejects.toBeInstanceOf(SalesOpportunityFrozenError);
  });

  it('updating description does not emit label_changed when labelId is omitted', async () => {
    const { harness, funnel } = await seedFunnel();
    const label = await harness.createLabel.execute({
      storeId,
      name: 'normal',
      color: '#22c55e',
    });

    const created = await harness.create.execute({
      storeId,
      funnelId: funnel.id,
      stageId: funnel.stages[0].id,
      title: 'Lead',
      labelId: label.id,
      actor: TEST_ACTOR,
    });

    // Simula a rota HTTP: objeto com labelId: undefined (chave presente).
    await harness.update.execute({
      storeId,
      id: created.id,
      description: 'Nova descrição',
      labelId: undefined,
      actor: TEST_ACTOR,
    });

    const history = await harness.history.execute({
      storeId,
      opportunityId: created.id,
    });
    expect(history.some((h) => h.actionType === 'label_changed')).toBe(false);
    expect(history.some((h) => h.actionType === 'updated')).toBe(true);

    const fresh = await harness.get.execute({ storeId, id: created.id });
    expect(fresh.labelId).toBe(label.id);
    expect(fresh.description).toBe('Nova descrição');
  });

  it('adds comment and deletes opportunity with history', async () => {
    const { harness, funnel } = await seedFunnel();
    const created = await harness.create.execute({
      storeId,
      funnelId: funnel.id,
      stageId: funnel.stages[0].id,
      title: 'Lead',
      actor: TEST_ACTOR,
    });

    const comment = await harness.comment.execute({
      storeId,
      opportunityId: created.id,
      content: 'Ligar amanhã',
      actor: TEST_ACTOR,
    });
    expect(comment.actionType).toBe('comment');
    expect(comment.content).toBe('Ligar amanhã');

    await harness.delete.execute({ storeId, id: created.id });
    await expect(
      harness.get.execute({ storeId, id: created.id }),
    ).rejects.toThrow();
  });
});
