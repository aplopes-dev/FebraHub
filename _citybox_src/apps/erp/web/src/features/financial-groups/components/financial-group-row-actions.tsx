"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import {
  canRemoveFinancialGroup,
  type FinancialGroup,
} from "@/features/financial-groups/types/financial-group";

type FinancialGroupRowActionsProps = {
  group: FinancialGroup;
  onEdit: (group: FinancialGroup) => void;
  onDelete: (group: FinancialGroup) => void | Promise<void>;
  onRestore: (group: FinancialGroup) => void | Promise<void>;
};

export function FinancialGroupRowActions({
  group,
  onEdit,
  onDelete,
  onRestore,
}: FinancialGroupRowActionsProps) {
  const removability = canRemoveFinancialGroup(group);
  const isDeleted = group.deletedAt != null;

  if (isDeleted) {
    return (
      <RowActionsMenu
        ariaLabel={`Ações de ${group.name}`}
        items={[
          {
            id: "restore",
            label: "Restaurar",
            icon: <RestoreIcon sx={{ fontSize: 16 }} />,
            onClick: () => onRestore(group),
          },
        ]}
      />
    );
  }

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${group.name}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onEdit(group),
        },
        {
          id: "delete",
          label: "Excluir",
          icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
          destructive: true,
          dividerBefore: true,
          disabled: !removability.removable,
          disabledCaption: removability.reason,
          onClick: () => {},
        },
      ]}
      confirmDelete={{
        title: "Excluir grupo financeiro?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{group.name}</span>? Ele ficará
            disponível na aba Excluídos.
          </>
        ),
        onConfirm: () => onDelete(group),
      }}
    />
  );
}
