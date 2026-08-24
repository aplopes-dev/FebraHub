import type { FilterGroupDef } from '@/components/filters';
import { createEmptyValues } from '@/components/filters';
import {
  TRANSACTION_STATUS_LABEL,
  TRANSACTION_TYPE_LABEL,
  type TransactionStatus,
  type TransactionType,
} from '../types';

const TRANSACTION_STATUSES = Object.keys(
  TRANSACTION_STATUS_LABEL,
) as TransactionStatus[];
const TRANSACTION_TYPES = Object.keys(TRANSACTION_TYPE_LABEL) as TransactionType[];

const STATIC_TRANSACTIONS_FILTER_GROUPS: FilterGroupDef[] = [
  {
    type: 'checkbox',
    key: 'type',
    title: 'Tipo',
    column: 'left',
    options: TRANSACTION_TYPES.map((value) => ({
      value,
      label: TRANSACTION_TYPE_LABEL[value],
    })),
  },
  {
    type: 'checkbox',
    key: 'status',
    title: 'Status',
    column: 'left',
    options: TRANSACTION_STATUSES.map((value) => ({
      value,
      label: TRANSACTION_STATUS_LABEL[value],
    })),
  },
];

export function buildTransactionsFilterGroups(
  agents: readonly { id: string; name: string }[],
): FilterGroupDef[] {
  return [
    ...STATIC_TRANSACTIONS_FILTER_GROUPS,
    {
      type: 'checkbox',
      key: 'agentId',
      title: 'Corretor',
      column: 'right',
      options: agents.map((agent) => ({
        value: agent.id,
        label: agent.name,
      })),
    },
  ];
}

/** Grupos vazios — use `buildTransactionsFilterGroups` na UI com equipe da API. */
export const TRANSACTIONS_FILTER_GROUPS = buildTransactionsFilterGroups([]);

export const EMPTY_TRANSACTIONS_FILTERS = createEmptyValues(TRANSACTIONS_FILTER_GROUPS);
