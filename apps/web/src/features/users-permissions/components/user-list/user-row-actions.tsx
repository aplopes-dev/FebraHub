"use client";

import RestoreIcon from "@mui/icons-material/RestoreOutlined";
import type { RowActionItem } from "@/components/ui/list-page";
import { RowActionsMenu } from "@/components/ui/list-page";
import type { PlatformUser } from "@/features/users-permissions/types/user";

type UserRowActionsProps = {
  user: PlatformUser;
  onDelete: (user: PlatformUser) => void | Promise<void>;
  onRestore: (user: PlatformUser) => void | Promise<void>;
};

export function UserRowActions({ user, onDelete, onRestore }: UserRowActionsProps) {
  const isDeleted = user.deletedAt != null;

  if (isDeleted) {
    const items: RowActionItem[] = [
      {
        id: "restore",
        label: "Restaurar",
        icon: <RestoreIcon fontSize="small" />,
        onClick: () => onRestore(user),
      },
    ];
    return <RowActionsMenu ariaLabel={`Ações de ${user.name}`} items={items} />;
  }

  const items: RowActionItem[] = [
    {
      id: "edit",
      label: "Editar",
      href: `/settings/users-permissions/${user.id}`,
    },
    {
      id: "delete",
      label: "Excluir",
      destructive: true,
      disabled: user.isCurrentUser,
      disabledCaption: user.isCurrentUser ? "Você não pode excluir sua própria conta" : undefined,
    },
  ];

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${user.name}`}
      items={items}
      confirmDelete={
        user.isCurrentUser
          ? undefined
          : {
              title: `Excluir "${user.name}"?`,
              description: "O usuário será movido para a aba Excluídos e perde o acesso ao sistema.",
              onConfirm: () => onDelete(user),
            }
      }
    />
  );
}
