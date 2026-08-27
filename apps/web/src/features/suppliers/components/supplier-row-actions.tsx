"use client";

import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import RestoreIcon from "@mui/icons-material/Restore";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import type { Supplier } from "@/features/suppliers/types/supplier";

type SupplierRowActionsProps = {
  supplier: Supplier;
  onEdit: (supplier: Supplier) => void;
  onDelete: (supplier: Supplier) => void;
  onRestore: (supplier: Supplier) => void;
};

export function SupplierRowActions({
  supplier,
  onEdit,
  onDelete,
  onRestore,
}: SupplierRowActionsProps) {
  const isDeleted = supplier.deletedAt != null;

  if (isDeleted) {
    return (
      <RowActionsMenu
        ariaLabel={`Ações de ${supplier.name}`}
        items={[
          {
            id: "restore",
            label: "Restaurar",
            icon: <RestoreIcon sx={{ fontSize: 16 }} />,
            onClick: () => onRestore(supplier),
          },
        ]}
      />
    );
  }

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${supplier.name}`}
      items={[
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onEdit(supplier),
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
        title: "Excluir fornecedor?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{supplier.name}</span>? Ele ficará
            disponível na aba Excluídos.
          </>
        ),
        onConfirm: () => onDelete(supplier),
      }}
    />
  );
}
