import { SalesLabelNameTakenError } from '../domain/errors/sales-label-name-taken.error';
import { SalesLabelNotFoundError } from '../domain/errors/sales-label-not-found.error';
import { createSalesLabelTestHarness } from './sales-label-test.fixtures';

describe('SalesLabel use cases', () => {
  const storeId = 'store-1';

  it('creates and lists labels with pagination meta', async () => {
    const harness = createSalesLabelTestHarness();

    await harness.create.execute({
      storeId,
      name: 'Urgente',
      color: '#ef4444',
    });
    await harness.create.execute({
      storeId,
      name: 'VIP',
      color: '#f59e0b',
    });

    const result = await harness.list.execute({
      storeId,
      page: 1,
      perPage: 50,
    });

    expect(result.total).toBe(2);
    expect(result.items.map((l) => l.name)).toEqual(['Urgente', 'VIP']);
    expect(result.items[0].color).toBe('#EF4444');
  });

  it('rejects duplicate name case-insensitive', async () => {
    const harness = createSalesLabelTestHarness();
    await harness.create.execute({
      storeId,
      name: 'Urgente',
      color: '#EF4444',
    });

    await expect(
      harness.create.execute({
        storeId,
        name: 'urgente',
        color: '#3B82F6',
      }),
    ).rejects.toBeInstanceOf(SalesLabelNameTakenError);
  });

  it('updates label and deletes with nullify side-effect marker', async () => {
    const harness = createSalesLabelTestHarness();
    const created = await harness.create.execute({
      storeId,
      name: 'Normal',
      color: '#3B82F6',
    });

    const updated = await harness.update.execute({
      storeId,
      id: created.id,
      name: 'Prioridade',
    });
    expect(updated.name).toBe('Prioridade');

    await harness.delete.execute({ storeId, id: created.id });
    expect(harness.repo.nullifiedOpportunityLabelIds).toContain(created.id);

    await expect(
      harness.update.execute({ storeId, id: created.id, name: 'X' }),
    ).rejects.toBeInstanceOf(SalesLabelNotFoundError);
  });
});
