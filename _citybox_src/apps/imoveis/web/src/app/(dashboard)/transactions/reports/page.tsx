import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Relatórios',
};

/** Relatórios unificados em `/transactions/finance`. */
export default function TransactionsReportsRoutePage() {
  redirect('/transactions/finance');
}
