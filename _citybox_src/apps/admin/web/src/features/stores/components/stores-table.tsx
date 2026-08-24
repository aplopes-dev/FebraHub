"use client";

import { useState } from "react";
import { ConfirmDialog, DataTable } from "@citybox/ui/organisms";
import { getStoresColumns } from "./stores-columns";
import { EditStoreDialog } from "./edit-store-dialog";
import type { Loja } from "../types";
import { useBlockStoreMutation } from "../hooks/use-store-mutations";

interface StoresTableProps {
  lojas: Loja[];
  blockingStoreId?: string;
}

export function StoresTable({ lojas, blockingStoreId }: StoresTableProps) {
  const [editingStore, setEditingStore] = useState<Loja | null>(null);
  const [blockingStore, setBlockingStore] = useState<Loja | null>(null);
  const blockMutation = useBlockStoreMutation();

  function handleEdit(loja: Loja) {
    setEditingStore(loja);
  }

  function handleBlock(loja: Loja) {
    setBlockingStore(loja);
  }

  async function handleConfirmBlock() {
    if (!blockingStore) return;
    await blockMutation.mutateAsync(blockingStore.id);
    setBlockingStore(null);
  }

  const columns = getStoresColumns({
    onEdit: handleEdit,
    onBlock: handleBlock,
  });

  const activeBlockingId =
    blockingStoreId ?? (blockMutation.isPending ? blockMutation.variables : undefined);

  return (
    <>
      <DataTable
        columns={columns}
        data={lojas}
        pageSize={8}
        entityName="lojas"
      />

      <EditStoreDialog
        open={!!editingStore}
        loja={editingStore}
        onOpenChange={(open) => {
          if (!open) setEditingStore(null);
        }}
      />

      <ConfirmDialog
        open={!!blockingStore}
        onOpenChange={(open) => {
          if (!open) setBlockingStore(null);
        }}
        title="Bloquear loja?"
        description={
          <>
            A loja <strong>{blockingStore?.tradeName}</strong> será bloqueada e
            perderá acesso ao sistema. Esta ação pode ser revertida
            posteriormente.
          </>
        }
        confirmLabel="Bloquear"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={blockMutation.isPending && blockingStore?.id === activeBlockingId}
        onConfirm={handleConfirmBlock}
      />
    </>
  );
}
