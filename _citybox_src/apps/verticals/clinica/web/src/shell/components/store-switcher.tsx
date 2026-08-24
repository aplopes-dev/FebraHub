'use client';

import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@citybox/ui/organisms';
import { StoreVerticalSelect } from '@/shell/components/store-vertical-select';
import { StoreLoadingShell } from '@/shell/components/store-loading-shell';
import type { StoreOption } from '@/lib/store-routing';
import { resolveStoreSwitchNavigation } from '@/lib/store-routing';
import { useStore } from '@/lib/store-context';

type StoreSwitcherProps = {
  disabled?: boolean;
  /** Header compacto — só o seletor de loja */
  compact?: boolean;
  className?: string;
};

export function StoreSwitcher({
  disabled,
  compact = false,
  className,
}: StoreSwitcherProps) {
  const { storeId, storeName, accessibleStores, setStore } = useStore();
  const [draftId, setDraftId] = useState(storeId);
  const [pending, setPending] = useState<StoreOption | null>(null);
  const [switching, setSwitching] = useState<StoreOption | null>(null);

  useEffect(() => {
    setDraftId(storeId);
  }, [storeId]);

  const onSelectChange = (nextId: string) => {
    if (!nextId || nextId === storeId) {
      setDraftId(nextId || storeId);
      return;
    }
    const target = accessibleStores.find((s) => s.id === nextId);
    if (!target) return;
    setDraftId(nextId);
    setPending(target);
  };

  const confirmSwitch = () => {
    if (!pending) return;
    setStore(pending.id, pending.name, pending.vertical);
    setSwitching(pending);
    setPending(null);
    const nav = resolveStoreSwitchNavigation(pending.vertical, window.location.pathname);
    if (nav === 'reload') {
      window.location.reload();
    } else {
      window.location.href = nav.href;
    }
  };

  if (switching) {
    return (
      <StoreLoadingShell message="Carregando clínica…" />
    );
  }

  return (
    <>
      {compact ? (
        <StoreVerticalSelect
          stores={accessibleStores}
          value={draftId}
          onChange={onSelectChange}
          disabled={disabled}
          id="header-store-combobox"
          aria-label="Trocar de clínica"
          emptyLabel={storeName || 'Selecione uma clínica…'}
          className={className ?? 'w-[7.5rem] sm:w-[min(100%,13rem)]'}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <p className="text-auxiliary text-muted-foreground">Clínica ativa</p>
            <p className="text-sm font-medium text-foreground">{storeName || 'Selecione…'}</p>
          </div>
          <StoreVerticalSelect
            stores={accessibleStores}
            value={draftId}
            onChange={onSelectChange}
            disabled={disabled}
            id="header-store-combobox"
            aria-label="Trocar de clínica"
          />
        </div>
      )}

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
            setDraftId(storeId);
          }
        }}
        title="Trocar de clínica"
        description={
          pending ? (
            <>
              Entrar em <strong>{pending.name}</strong>? O sistema voltará para a visão geral com os
              dados desta clínica.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Confirmar troca"
        onConfirm={confirmSwitch}
      />
    </>
  );
}
