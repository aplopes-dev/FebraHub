'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { verticalModulePath } from '@/lib/store-routing';
import { useSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';

function EntradaInner() {
  const router = useRouter();
  const params = useSearchParams();
  const fresh = params.get('fresh') === '1';
  const { status } = useSession();
  const { accessibleStores, storeId, loading, setStore } = useStore();

  useEffect(() => {
    if (status === 'loading' || loading) return;
    if (status === 'anonymous') {
      router.replace('/login');
      return;
    }

    void (async () => {
      const accessible = accessibleStores;

      if (accessible.length === 0) {
        router.replace('/selecionar-loja?sem-loja=1');
        return;
      }

      if (fresh && accessible.length > 1) {
        router.replace('/selecionar-loja');
        return;
      }

      if (accessible.length === 1) {
        const only = accessible[0];
        setStore(only.id, only.name, only.vertical);
        router.replace(verticalModulePath(only.vertical));
        return;
      }

      const current = accessible.find((s) => s.id === storeId);
      if (current) {
        router.replace(verticalModulePath(current.vertical));
        return;
      }

      router.replace('/selecionar-loja');
    })();
  }, [accessibleStores, fresh, loading, router, setStore, status, storeId]);

  return <AuthLoadingShell message="Preparando acesso à sua clínica…" />;
}

export default function EntradaPage() {
  return (
    <Suspense fallback={<AuthLoadingShell message="Preparando acesso…" />}>
      <EntradaInner />
    </Suspense>
  );
}
