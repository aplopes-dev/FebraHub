'use client';

import { PLACEHOLDER_STORE } from '@/features/shared';
import { PosUiProvider } from '@/features/pos/context/pos-ui-context';
import { PosSideMenu } from '@/features/pos/components/pos-side-menu';
import { PosHeader } from '@/features/pos/components/pos-header';
import { SettingsLayout } from '@/features/settings/components/settings-layout';

export default function ConfiguracoesPage() {
  return (
    <PosUiProvider>
      <main className="flex h-full min-h-0 w-full">
        <PosSideMenu store={PLACEHOLDER_STORE} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <PosHeader />
          <div className="flex-1 min-h-0 bg-[#F7F7F7] overflow-y-auto">
            <SettingsLayout />
          </div>
        </div>
      </main>
    </PosUiProvider>
  );
}
