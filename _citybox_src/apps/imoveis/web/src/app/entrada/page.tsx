'use client';

import { useRouter } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import { AuthLoadingShell } from '@/components/auth/auth-page-shell';
import { verticalModulePath } from '@/lib/store-routing';
import { useAuthSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';

function EntradaInner() {
  const router = useRouter();
  const { status } = useAuthSession();
  const { accessibleStores, storeId, loading, setStore } = useStore();

  useEffect(() => {
    if (status === 'loading' || loading) return;
    if (status === 'anonymous') {
      router.replace('/login');
      return;
    }

    const accessible = accessibleStores;

    if (accessible.length === 0) {
      router.replace('/selecionar-loja?sem-loja=1');
      return;
    }

    if (accessible.length === 1) {
      const only = accessible[0];
      setStore(only.id, only.name, only.vertical);
      router.replace(verticalModulePath(only.vertical));
      return;
    }

    // Multi-loja: entra na última usada se ainda for acessível.
    // Só pede escolha quando não há preferência válida.
    const preferred = accessible.find((s) => s.id === storeId);
    if (preferred) {
      router.replace(verticalModulePath(preferred.vertical));
      return;
    }

    router.replace('/selecionar-loja');
  }, [accessibleStores, loading, router, setStore, status, storeId]);

  return <AuthLoadingShell message="Preparando acesso à sua imobiliária…" />;
}

export default function EntradaPage() {
  return (
    <Suspense fallback={<AuthLoadingShell message="Preparando acesso…" />}>
      <EntradaInner />
    </Suspense>
  );
}
