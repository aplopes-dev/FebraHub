import { BankStatement } from '../domain/entities/bank-statement.entity';
import {
  BankStatementRepository,
  type BankStatementListCriteria,
} from '../domain/repositories/bank-statement.repository.interface';

export class InMemoryBankStatementRepository extends BankStatementRepository {
  private readonly items = new Map<string, BankStatement>();

  async findById(
    organizationId: string,
    id: string,
  ): Promise<BankStatement | null> {
    const item = this.items.get(id);
    if (!item || item.organizationId !== organizationId) return null;
    return item;
  }

  async findAll(
    organizationId: string,
    criteria: BankStatementListCriteria = {},
  ): Promise<BankStatement[]> {
    return this.filter(organizationId, criteria);
  }

  async count(
    organizationId: string,
    criteria: Omit<BankStatementListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.filter(organizationId, criteria).length;
  }

  async delete(organizationId: string, id: string): Promise<void> {
    const existing = this.items.get(id);
    if (existing && existing.organizationId === organizationId) {
      this.items.delete(id);
    }
  }

  async save(bankStatement: BankStatement): Promise<BankStatement> {
    this.items.set(bankStatement.id, bankStatement);
    return bankStatement;
  }

  private filter(
    organizationId: string,
    criteria: BankStatementListCriteria,
  ): BankStatement[] {
    let list = [...this.items.values()]
      .filter((item) => item.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    if (criteria.bankAccountId) {
      list = list.filter(
        (item) => item.bankAccountId === criteria.bankAccountId,
      );
    }
    if (criteria.status) {
      list = list.filter((item) => item.status === criteria.status);
    }

    const skip = criteria.skip ?? 0;
    const take = criteria.take;
    return take === undefined
      ? list.slice(skip)
      : list.slice(skip, skip + take);
  }
}
