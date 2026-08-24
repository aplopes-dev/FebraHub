import type { Metadata } from 'next';
import { FinancePage } from '@/features/finance/components/finance-page';

export const metadata: Metadata = {
  title: 'Financeiro',
};

export default function TransactionsFinancePage() {
  return <FinancePage />;
}
