import type { FinancialAccount } from '../../../../domain/entities/financial-account.entity';

export function toFinancialAccountResponse(account: FinancialAccount) {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    isActive: account.isActive,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}
