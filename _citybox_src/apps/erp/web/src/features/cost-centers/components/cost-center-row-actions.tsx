"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import {
  canRemoveCostCenter,
  type CostCenter,
} from "@/features/cost-centers/types/cost-center";

type CostCenterRowActionsProps = {
  costCenter: CostCenter;
  onEdit: (costCenter: CostCenter) => void;
  onDelete: (costCenter: CostCenter) => void | Promise<void>;
  onRestore: (costCenter: CostCenter) => void | Promise<void>;
};

export function CostCenterRowActions({
  costCenter,
  onEdit,
  onDelete,
  onRestore,
}: CostCenterRowActionsProps) {
  const removability = canRemoveCostCenter(costCenter);
  const isDeleted = costCenter.deletedAt != null;

  if (isDeleted) {
    return (
      <RowActionsMenu
        ariaLabel={`Ações de ${costCenter.name}`}
        items={[
          {
            id: "restore",
            label: "Restaurar",
            icon: <RestoreIcon sx={{ fontSize: 16 }} />,
            onClick: () => onRestore(costCenter),
          },
        ]}
      />
    );
  }

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${costCenter.name}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onEdit(costCenter),
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
        title: "Excluir centro de custo?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{costCenter.name}</span>? Ele
            ficará disponível na aba Excluídos.
          </>
        ),
        onConfirm: () => onDelete(costCenter),
      }}
    />
  );
}
