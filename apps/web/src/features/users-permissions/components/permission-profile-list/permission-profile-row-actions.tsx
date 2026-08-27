"use client";

import RestoreIcon from "@mui/icons-material/RestoreOutlined";
import type { RowActionItem } from "@/components/ui/list-page";
import { RowActionsMenu } from "@/components/ui/list-page";
import type { PermissionProfile } from "@/features/users-permissions/types/permission-profile";

type PermissionProfileRowActionsProps = {
  profile: PermissionProfile;
  onDelete: (profile: PermissionProfile) => void | Promise<void>;
  onRestore?: (profile: PermissionProfile) => void | Promise<void>;
};

export function PermissionProfileRowActions({
  profile,
  onDelete,
  onRestore,
}: PermissionProfileRowActionsProps) {
  const isDeleted = profile.deletedAt != null;

  if (isDeleted) {
    const items: RowActionItem[] = [
      {
        id: "restore",
        label: "Restaurar",
        icon: <RestoreIcon fontSize="small" />,
        onClick: () => onRestore?.(profile),
      },
    ];
    return <RowActionsMenu ariaLabel={`Ações de ${profile.name}`} items={items} />;
  }

  const blockedBySystem = profile.isSystem;

  const items: RowActionItem[] = [
    {
      id: "edit",
      label: "Editar",
      href: `/settings/users-permissions/profiles/${profile.id}`,
      disabled: blockedBySystem,
      disabledCaption: blockedBySystem
        ? "Administrador não pode ser editado"
        : undefined,
    },
    {
      id: "delete",
      label: "Excluir",
      destructive: true,
      disabled: blockedBySystem,
      disabledCaption: blockedBySystem
        ? "Administrador não pode ser excluído"
        : undefined,
    },
  ];

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${profile.name}`}
      items={items}
      confirmDelete={
        blockedBySystem
          ? undefined
          : {
              title: `Excluir "${profile.name}"?`,
              description:
                "O perfil será movido para a aba Excluídos. Se ainda houver usuários vinculados, a exclusão será recusada.",
              onConfirm: () => onDelete(profile),
            }
      }
    />
  );
}
