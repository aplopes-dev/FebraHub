"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import type { Carrier } from "@/features/carriers/types/carrier";

type CarrierRowActionsProps = {
  carrier: Carrier;
  onEdit: (carrier: Carrier) => void;
  onDelete: (carrier: Carrier) => void;
  onRestore: (carrier: Carrier) => void;
};

export function CarrierRowActions({
  carrier,
  onEdit,
  onDelete,
  onRestore,
}: CarrierRowActionsProps) {
  const isDeleted = carrier.deletedAt != null;

  if (isDeleted) {
    return (
      <RowActionsMenu
        ariaLabel={`Ações de ${carrier.tradeName}`}
        items={[
          {
            id: "restore",
            label: "Restaurar",
            icon: <RestoreIcon sx={{ fontSize: 16 }} />,
            onClick: () => onRestore(carrier),
          },
        ]}
      />
    );
  }

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${carrier.tradeName}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onEdit(carrier),
        },
        {
          id: "delete",
          label: "Excluir",
          icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
          destructive: true,
          dividerBefore: true,
          onClick: () => {},
        },
      ]}
      confirmDelete={{
        title: "Excluir transportadora?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{carrier.tradeName}</span>? Ela
            ficará disponível na aba Excluídas.
          </>
        ),
        onConfirm: () => onDelete(carrier),
      }}
    />
  );
}
