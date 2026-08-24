"use client";

import { Copy, Loader2, MailCheck, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@citybox/ui/atoms";
import type { PlatformUser } from "../types";

interface UserActionsMenuProps {
  user: PlatformUser;
  onEdit: (user: PlatformUser) => void;
  onDelete: (user: PlatformUser) => void;
  onResendInvite: () => void;
  disabled?: boolean;
  isResending?: boolean;
}

export function UserActionsMenu({
  user,
  onEdit,
  onDelete,
  onResendInvite,
  disabled,
  isResending,
}: UserActionsMenuProps) {
  function handleCopyEmail() {
    navigator.clipboard.writeText(user.email ?? "").catch(() => null);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Abrir ações do usuário"
          className="h-8 w-8 shrink-0"
          disabled={disabled}
        >
          {isResending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={disabled} onClick={() => onEdit(user)}>
            <Pencil className="mr-2 h-4 w-4" />
            Editar usuário
          </DropdownMenuItem>
          <DropdownMenuItem disabled={disabled} onClick={onResendInvite}>
            {isResending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <MailCheck className="mr-2 h-4 w-4" />
            )}
            Reenviar convite
          </DropdownMenuItem>
          <DropdownMenuItem disabled={disabled} onClick={handleCopyEmail}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar e-mail
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={disabled}
          onClick={() => onDelete(user)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Remover acesso
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
