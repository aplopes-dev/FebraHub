"use client";

import type { ComponentType } from "react";
import {
  KeyRound,
  Loader2,
  MailCheck,
  MoreHorizontal,
  UserMinus,
  UserPen,
} from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@citybox/ui/atoms";
import type { StoreEmployee } from "../../types";

interface StoreMemberActionsMenuProps {
  member: StoreEmployee;
  onEdit: (member: StoreEmployee) => void;
  onResetPassword: (member: StoreEmployee) => void;
  onSendPasswordLink: (member: StoreEmployee) => void;
  onRevoke: (member: StoreEmployee) => void;
  isResettingPassword?: boolean;
  isSendingPasswordLink?: boolean;
  pendingMemberId?: string | null;
  /**
   * Quando presente, todas as ações ficam desabilitadas e este texto explica o porquê.
   *
   * Usado para loja cuja equipe é da vertical: estas ações escrevem em
   * `platform.store_members`, que não é a fonte de verdade desses membros — o operador
   * veria "sucesso" sem efeito nenhum.
   */
  disabledReason?: string;
}

function DisabledMenuItemWithTooltip({
  label,
  icon: Icon,
  tooltip,
}: {
  label: string;
  icon: ComponentType<{ className?: string }>;
  tooltip: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex w-full">
          <DropdownMenuItem
            disabled
            className="w-full pointer-events-none opacity-50"
            onSelect={(event) => event.preventDefault()}
          >
            <Icon className="mr-2 h-4 w-4" />
            {label}
          </DropdownMenuItem>
        </span>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function StoreMemberActionsMenu({
  member,
  onEdit,
  onResetPassword,
  onSendPasswordLink,
  onRevoke,
  isResettingPassword,
  isSendingPasswordLink,
  pendingMemberId,
  disabledReason,
}: StoreMemberActionsMenuProps) {
  const hasEmail = Boolean(member.email?.trim());
  const isPending =
    pendingMemberId === member.id && (isResettingPassword || isSendingPasswordLink);

  return (
    <TooltipProvider delayDuration={200}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            <span className="sr-only">Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {disabledReason ? (
            <>
              <DisabledMenuItemWithTooltip
                label="Editar Usuário"
                icon={UserPen}
                tooltip={disabledReason}
              />
              <DisabledMenuItemWithTooltip
                label={member.hasPassword ? "Resetar senha" : "Gerar senha"}
                icon={KeyRound}
                tooltip={disabledReason}
              />
              <DisabledMenuItemWithTooltip
                label="Enviar link para nova senha"
                icon={MailCheck}
                tooltip={disabledReason}
              />
              <DropdownMenuSeparator />
              <DisabledMenuItemWithTooltip
                label="Revogar Acesso"
                icon={UserMinus}
                tooltip={disabledReason}
              />
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={() => onEdit(member)}>
                <UserPen className="mr-2 h-4 w-4" />
                Editar Usuário
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={isPending}
                onClick={() => onResetPassword(member)}
              >
                {isResettingPassword && pendingMemberId === member.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                {member.hasPassword ? "Resetar senha" : "Gerar senha"}
              </DropdownMenuItem>
              {hasEmail ? (
                <DropdownMenuItem
                  disabled={isPending}
                  onClick={() => onSendPasswordLink(member)}
                >
                  {isSendingPasswordLink && pendingMemberId === member.id ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MailCheck className="mr-2 h-4 w-4" />
                  )}
                  Enviar link para nova senha
                </DropdownMenuItem>
              ) : (
                <DisabledMenuItemWithTooltip
                  label="Enviar link para nova senha"
                  icon={MailCheck}
                  tooltip="O usuário precisa ter um e-mail cadastrado para receber o link de redefinição de senha."
                />
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                disabled={isPending}
                onClick={() => onRevoke(member)}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Revogar Acesso
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
}
