import type { Metadata } from 'next';
import { TransactionDetailLoader } from '@/features/transactions/components/transaction-detail-loader';

export const metadata: Metadata = {
  title: 'Detalhe da transação',
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function TransactionDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <TransactionDetailLoader id={id} />;
}
