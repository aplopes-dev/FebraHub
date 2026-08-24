'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@citybox/ui/atoms';
import {
  CLINICA_PERMISSION_DENIED_MESSAGE,
  CLINICA_PERMISSION_DENIED_TITLE,
  getPermissionDeniedDialogState,
  reloadAfterPermissionDenied,
  subscribePermissionDeniedDialog,
} from '../api/permission-denied-dialog-store';

/**
 * Modal global: 403 de permissão em mutations → informa e recarrega no OK.
 * Montar uma vez no shell da clínica.
 */
export function PermissionDeniedDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(CLINICA_PERMISSION_DENIED_MESSAGE);

  useEffect(() => {
    const sync = () => {
      const next = getPermissionDeniedDialogState();
      setOpen(next.open);
      setMessage(next.message);
    };
    sync();
    return subscribePermissionDeniedDialog(sync);
  }, []);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        // Só fecha via OK (reload) — evita dismiss sem atualizar permissões.
        if (!next) return;
      }}
    >
      <AlertDialogContent>
        <div className="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
          <div
            aria-hidden="true"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
          >
            <ShieldAlert className="size-4 opacity-80" />
          </div>
          <AlertDialogHeader>
            <AlertDialogTitle>{CLINICA_PERMISSION_DENIED_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>{message}</AlertDialogDescription>
          </AlertDialogHeader>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              reloadAfterPermissionDenied();
            }}
          >
            OK
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
