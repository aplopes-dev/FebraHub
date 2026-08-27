"use client";

import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import ScaleIcon from "@mui/icons-material/Scale";
import SouthWestIcon from "@mui/icons-material/SouthWest";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { RowActionsMenu } from "@/components/ui/list-page/row-actions-menu";
import { canRemoveStock, type Stock } from "@/features/stock/types/stock";

type StockRowActionsProps = {
  stock: Stock;
  onDelete: (stock: Stock) => void;
};

export function StockRowActions({ stock, onDelete }: StockRowActionsProps) {
  const removability = canRemoveStock(stock);

  return (
    <RowActionsMenu
      ariaLabel={`Ações de ${stock.name}`}
      items={[
        {
          id: "entrada",
          label: "Registrar entrada",
          icon: <SouthWestIcon sx={{ fontSize: 16 }} />,
          href: `/estoque/movimentacoes/novo?type=entrada&estoque=${stock.id}`,
        },
        {
          id: "saida",
          label: "Registrar saída",
          icon: <SwapHorizIcon sx={{ fontSize: 16 }} />,
          href: `/estoque/movimentacoes/novo?type=saida&estoque=${stock.id}`,
        },
        {
          id: "balanco",
          label: "Balanço",
          icon: <ScaleIcon sx={{ fontSize: 16 }} />,
          href: `/estoque/${stock.id}/balanco`,
        },
        {
          id: "inventario",
          label: "Inventários",
          icon: <AssignmentOutlinedIcon sx={{ fontSize: 16 }} />,
          href: `/estoque/${stock.id}/inventario`,
        },
        {
          id: "edit",
          label: "Editar",
          icon: <EditOutlinedIcon sx={{ fontSize: 16 }} />,
          dividerBefore: true,
          href: `/estoque/${stock.id}`,
        },
        {
          id: "delete",
          label: "Excluir",
          icon: <DeleteOutlinedIcon sx={{ fontSize: 16 }} />,
          destructive: true,
          disabled: !removability.removable,
          disabledCaption: removability.reason,
          onClick: () => {},
        },
      ]}
      confirmDelete={{
        title: "Excluir estoque?",
        description: (
          <>
            Tem certeza que deseja excluir{" "}
            <span style={{ fontWeight: 600 }}>{stock.name}</span>? Essa ação não
            pode ser desfeita.
          </>
        ),
        onConfirm: () => onDelete(stock),
      }}
    />
  );
}
