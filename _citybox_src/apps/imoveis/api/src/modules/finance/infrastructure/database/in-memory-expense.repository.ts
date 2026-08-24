import { randomUUID } from 'crypto';
import { ExpenseEntity } from '../../domain/entities/expense.entity';
import {
  ExpenseRepository,
  type ExpenseWritePayload,
} from '../../domain/repositories/expense.repository.interface';

/** Repositório em memória para testes unitários dos use-cases. */
export class InMemoryExpenseRepository extends ExpenseRepository {
  private readonly items = new Map<string, ExpenseEntity>();

  async findMany(storeId: string): Promise<ExpenseEntity[]> {
    await Promise.resolve();
    return [...this.items.values()]
      .filter((e) => e.storeId === storeId)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async create(payload: ExpenseWritePayload): Promise<ExpenseEntity> {
    await Promise.resolve();
    const id = randomUUID();
    const entity = ExpenseEntity.create(
      {
        storeId: payload.storeId,
        label: payload.label,
        amountCents: payload.amountCents,
        date: payload.date,
        category: payload.category,
        createdAt: new Date(),
      },
      id,
    );
    this.items.set(id, entity);
    return entity;
  }

  async delete(storeId: string, id: string): Promise<boolean> {
    await Promise.resolve();
    const existing = this.items.get(id);
    if (!existing || existing.storeId !== storeId) return false;
    this.items.delete(id);
    return true;
  }
}
