"use client";

import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import type { Kds, KdsStatus } from "@/features/kds/types/kds";

type KdsRowActionsProps = {
  kds: Kds;
  onEdit: (kds: Kds) => void;
  onChangeStatus: (kds: Kds, status: KdsStatus) => void;
  onDelete: (kds: Kds) => void | Promise<void>;
};

export function KdsRowActions({
  kds,
  onEdit,
  onChangeStatus,
  onDelete,
}: KdsRowActionsProps) {
  const isActive = kds.status === "active";

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${kds.name}`}
      items={[
        {
          id: "products",
          label: "Vincular produtos",
          icon: <Inventory2OutlinedIcon sx={{ fontSize: 16 }} />,
          href: `/ponto-de-venda/kds/${kds.id}/produtos`,
        },
        isActive
          ? {
              id: "mark-inactive",
              label: "Marcar como inativo",
              icon: <BlockOutlinedIcon sx={{ fontSize: 16 }} />,
              onClick: () => onChangeStatus(kds, "inactive"),
            }
          : {
              id: "mark-active",
              label: "Marcar como ativo",
              icon: <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />,
              onClick: () => onChangeStatus(kds, "active"),
            },
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onEdit(kds),
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
        title: "Excluir KDS?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{kds.name}</span>? Os produtos
            vinculados a ele deixam de ser enviados para esta tela.
          </>
        ),
        onConfirm: () => onDelete(kds),
      }}
    />
  );
}
