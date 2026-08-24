'use client';

import { PLACEHOLDER_STORE } from '@/features/shared';
import { PosUiProvider } from '../context/pos-ui-context';
import { PosLayout } from '../components/pos-layout';

export function PosPage() {
  return (
    <PosUiProvider>
      <PosLayout store={PLACEHOLDER_STORE} />
    </PosUiProvider>
  );
}
