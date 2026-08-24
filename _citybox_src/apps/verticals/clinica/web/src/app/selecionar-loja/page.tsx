'use client';

import { Loader2, LogOut, Store } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { Button } from '@citybox/ui/atoms';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { AuthStatusPanel } from '@/components/auth/auth-status-panel';
import { StoreVerticalField } from '@/shell/components/store-vertical-select';
import { verticalModulePath } from '@/lib/store-routing';
import { useSession } from '@/lib/session-context';
import { useStore } from '@/lib/store-context';

export default function SelecionarLojaPage() {
  const router = useRouter();
  const { status, logout } = useSession();
  const { accessibleStores, loading, setStore, storesLoadError } = useStore();
  const [ready, setReady] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [isEntering, startEntering] = useTransition();

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'anonymous') {
      router.replace('/login');
      return;
    }
    setReady(true);

    if (!loading && accessibleStores.length === 1) {
      const only = accessibleStores[0];
      setStore(only.id, only.name, only.vertical);
      router.replace(verticalModulePath(only.vertical));
    }
  }, [accessibleStores, loading, router, setStore, status]);

  const enterSelected = () => {
    const store = accessibleStores.find((s) => s.id === selectedId);
    if (!store) return;
    setStore(store.id, store.name, store.vertical);
    startEntering(() => {
      router.push(verticalModulePath(store.vertical));
    });
  };

  if (!ready || loading) {
    return (
      <AuthPageShell title="Escolha a clínica" description="Selecione em qual clínica deseja trabalhar.">
        <AuthStatusPanel variant="loading" message="Carregando suas clínicas…" />
      </AuthPageShell>
    );
  }

  if (storesLoadError === 'unavailable') {
    return (
      <AuthPageShell
        title="Serviço indisponível"
        description="não foi possível carregar suas clínicas agora."
      >
        <div className="mb-6">
          <AuthStatusPanel
            variant="warning"
            message="A admin-api não está respondendo (porta 3103). Rode pnpm dev ou pnpm --filter @citybox/admin-api dev e tente novamente."
          />
        </div>
        <Button variant="outline" className="w-full" onClick={() => window.location.reload()}>
          Tentar novamente
        </Button>
      </AuthPageShell>
    );
  }

  if (accessibleStores.length === 0) {
    return (
      <AuthPageShell
        title="Nenhuma clínica disponível"
        description="Sua conta ainda não está vinculada a uma clínica."
      >
        <div className="mb-6">
          <AuthStatusPanel
            variant="warning"
            message="Peça ao administrador da plataforma para incluí-lo na equipe de uma clínica."
          />
        </div>
        <Button variant="outline" className="w-full" onClick={() => void logout()}>
          <LogOut className="size-4" />
          Sair da conta
        </Button>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Escolha a clínica"
      description="Selecione em qual clínica deseja trabalhar."
      cardClassName="max-w-[440px]"
    >
      <div className="mb-4 flex items-center justify-end">
        <Button variant="ghost" size="sm" onClick={() => void logout()}>
          <LogOut className="size-4" />
          Sair
        </Button>
      </div>

      <div className="space-y-5">
        <StoreVerticalField
          stores={accessibleStores}
          value={selectedId}
          onChange={setSelectedId}
          allowEmpty
          id="selecionar-loja-combobox"
          className="w-full"
        />

        <Button
          className="w-full"
          size="lg"
          disabled={!selectedId || isEntering}
          onClick={enterSelected}
        >
          {isEntering ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Store className="size-4" />
          )}
          {isEntering ? 'Entrando…' : 'Continuar'}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {accessibleStores.length}{' '}
          {accessibleStores.length === 1 ? 'clínica vinculada' : 'clínicas vinculadas'}
        </p>
      </div>
    </AuthPageShell>
  );
}
