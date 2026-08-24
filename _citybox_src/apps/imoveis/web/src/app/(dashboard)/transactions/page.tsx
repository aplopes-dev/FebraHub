import type { Metadata } from 'next';
import { TransactionsPage } from '@/features/transactions/components/transactions-page';

export const metadata: Metadata = {
  title: 'Transações',
};

export default function Page() {
  return <TransactionsPage />;
}
