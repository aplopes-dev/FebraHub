'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TransactionDetailContent } from './transaction-detail-content';

export function TransactionDetailLoader({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!id) router.replace('/transactions');
  }, [id, router]);

  return <TransactionDetailContent id={id} />;
}
