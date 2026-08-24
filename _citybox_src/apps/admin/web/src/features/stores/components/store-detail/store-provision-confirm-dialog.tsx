"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@citybox/ui/atoms";
import { Loader2 } from "lucide-react";

export type ProvisionConfirmPreview = {
  responsibleName: string;
  email: string;
  username: string;
};

interface StoreProvisionConfirmDialogProps {
  open: boolean;
  preview: ProvisionConfirmPreview | null;
  isPending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmação antes do POST `/provision` — mostra quem será criado no Keycloak.
 */
export function StoreProvisionConfirmDialog({
  open,
  preview,
  isPending,
  onConfirm,
  onCancel,
}: StoreProvisionConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !isPending) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provisionar acesso do responsável</DialogTitle>
          <DialogDescription>
            Será criado o usuário na vertical e no Keycloak. A senha provisória aparece
            só depois da confirmação.
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <dl className="space-y-3 text-sm">
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Nome
              </dt>
              <dd className="font-medium">{preview.responsibleName}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                E-mail
              </dt>
              <dd className="font-mono text-sm">{preview.email}</dd>
            </div>
            <div className="space-y-1">
              <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Username (prévia)
              </dt>
              <dd className="font-mono text-sm">{preview.username}</dd>
            </div>
          </dl>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" disabled={isPending} onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" disabled={isPending || !preview} onClick={onConfirm}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Provisionando…
              </>
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
