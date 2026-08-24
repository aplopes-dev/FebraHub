/**
 * Configuração de comissão e despesas — consome imoveis-api.
 */
import { imoveisFetch } from '@/lib/imoveis-api';
import type { CommissionConfigState, ExpenseEntry } from '../types';

export async function getCommissionConfig(): Promise<CommissionConfigState> {
  const res = await imoveisFetch<{ data: CommissionConfigState }>(
    '/v1/finance/commission-config',
  );
  return res.data;
}

export async function saveCommissionConfig(
  config: CommissionConfigState,
): Promise<CommissionConfigState> {
  const res = await imoveisFetch<{ data: CommissionConfigState }>(
    '/v1/finance/commission-config',
    {
      method: 'PUT',
      body: JSON.stringify({
        global: config.global,
        agentOverrides: [...config.agentOverrides],
      }),
    },
  );
  return res.data;
}

export async function listExpenses(): Promise<readonly ExpenseEntry[]> {
  const res = await imoveisFetch<{ data: ExpenseEntry[] }>(
    '/v1/finance/expenses',
  );
  return res.data;
}

export async function createExpense(input: {
  label: string;
  amountCents: number;
  date: string;
  category?: string;
}): Promise<ExpenseEntry> {
  const res = await imoveisFetch<{ data: ExpenseEntry }>(
    '/v1/finance/expenses',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
  return res.data;
}

export async function deleteExpense(id: string): Promise<void> {
  await imoveisFetch<void>(`/v1/finance/expenses/${id}`, {
    method: 'DELETE',
  });
}

/** Compatível com o contrato antigo usado por `resolveDefaultSplit`. */
export const commissionConfigRepository = {
  getConfig: getCommissionConfig,
  saveConfig: saveCommissionConfig,
  getExpenses: listExpenses,
};
