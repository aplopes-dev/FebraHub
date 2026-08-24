"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, Badge } from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";
import { cn } from "@citybox/ui";
import type { PlatformUser } from "../types";
import { DASHBOARD_CARD, getInitials } from "../lib/usuarios-ui";
import { formatDateTime } from "../lib/format-datetime";
import { UserActionsMenu } from "./user-actions-menu";

const ROLE_LABEL: Record<string, string> = {
  platform_admin: "Administrador",
  platform_operator: "Operador",
};

interface UserCardProps {
  user: PlatformUser;
  onEdit: (user: PlatformUser) => void;
  onDelete: (user: PlatformUser) => Promise<void>;
  onResendInvite: (user: PlatformUser) => Promise<void>;
  isDeleting?: boolean;
  isResending?: boolean;
}

export function UserCard({
  user,
  onEdit,
  onDelete,
  onResendInvite,
  isDeleting,
  isResending,
}: UserCardProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);
  const displayName = user.displayName ?? "(sem nome)";
  const email = user.email ?? "—";
  const actionsDisabled = Boolean(isDeletingLocal || isDeleting || isResending);
  const isConfirmingDelete = isDeletingLocal || Boolean(isDeleting);

  const handleConfirmDelete = async () => {
    setIsDeletingLocal(true);
    try {
      await onDelete(user);
      setDeleteConfirmOpen(false);
    } catch {
      // Erro tratado pelo hook de mutação (toast)
    } finally {
      setIsDeletingLocal(false);
    }
  };

  const handleResendInvite = async () => {
    try {
      await onResendInvite(user);
    } catch {
      // Erro tratado pelo hook de mutação (toast)
    }
  };

  return (
    <>
      <div className={cn(DASHBOARD_CARD, "flex h-full flex-col p-5")}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="h-11 w-11 shrink-0">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-semibold tracking-tight text-[var(--orbitly-ink)]">
                {displayName}
              </h3>
              <p className="mt-0.5 truncate text-sm text-foreground/55">{email}</p>
              <Badge
                variant="secondary"
                className="mt-1.5 text-xs font-normal"
              >
                {ROLE_LABEL[user.role] ?? user.role}
              </Badge>
            </div>
          </div>

          <UserActionsMenu
            user={user}
            onEdit={onEdit}
            onDelete={() => setDeleteConfirmOpen(true)}
            onResendInvite={handleResendInvite}
            disabled={actionsDisabled}
            isResending={isResending}
          />
        </div>

        <div className="mt-auto pt-2">
          <p className="truncate text-xs text-foreground/45">
            Criado em: {formatDateTime(user.createdAt)}
          </p>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Remover usuário?"
        description={
          <>
            O acesso de <strong>{displayName}</strong> ao painel CityBox será
            revogado imediatamente.
          </>
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={isConfirmingDelete}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
