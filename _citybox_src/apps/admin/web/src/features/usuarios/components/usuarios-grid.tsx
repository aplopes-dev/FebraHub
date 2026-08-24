"use client";

import { Users } from "lucide-react";
import type { PlatformUser } from "../types";
import { UserCard } from "./user-card";

interface UsuariosGridProps {
  users: PlatformUser[];
  onEdit: (user: PlatformUser) => void;
  onDelete: (user: PlatformUser) => Promise<void>;
  onResendInvite: (user: PlatformUser) => Promise<void>;
  deletingUserId?: string;
  resendingUserId?: string;
}

export function UsuariosGrid({
  users,
  onEdit,
  onDelete,
  onResendInvite,
  deletingUserId,
  resendingUserId,
}: UsuariosGridProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 py-16 text-center">
        <Users className="h-8 w-8 text-foreground/25" />
        <div>
          <p className="font-medium text-foreground/70">
            Nenhum usuário encontrado
          </p>
          <p className="mt-1 text-sm text-foreground/45">
            Ajuste a busca ou o filtro de perfil.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          onResendInvite={onResendInvite}
          isDeleting={deletingUserId === user.id}
          isResending={resendingUserId === user.id}
        />
      ))}
    </div>
  );
}
