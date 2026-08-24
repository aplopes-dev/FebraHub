"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import {
  canRemoveChartOfAccount,
  type ChartOfAccount,
} from "@/features/chart-of-accounts/types/chart-of-account";

type ChartOfAccountRowActionsProps = {
  account: ChartOfAccount;
  onEdit: (account: ChartOfAccount) => void;
  onDelete: (account: ChartOfAccount) => void | Promise<void>;
  onRestore: (account: ChartOfAccount) => void | Promise<void>;
};

export function ChartOfAccountRowActions({
  account,
  onEdit,
  onDelete,
  onRestore,
}: ChartOfAccountRowActionsProps) {
  const removability = canRemoveChartOfAccount(account);
  const isDeleted = account.deletedAt != null;

  if (isDeleted) {
    return (
      <RowActionsMenu
        ariaLabel={`Ações de ${account.name}`}
        items={[
          {
            id: "restore",
            label: "Restaurar",
            icon: <RestoreIcon sx={{ fontSize: 16 }} />,
            onClick: () => onRestore(account),
          },
        ]}
      />
    );
  }

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${account.name}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onEdit(account),
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
        title: "Excluir plano de contas?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{account.name}</span>? Ele ficará
            disponível na aba Excluídos.
          </>
        ),
        onConfirm: () => onDelete(account),
      }}
    />
  );
}
