"use client";

import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { RowActionsMenu } from "@/components/ui/list-page";
import type { StockMovementListItem } from "@/features/stock-movements/types/stock-movement";

type StockMovementRowActionsProps = {
  movement: StockMovementListItem;
  onView: (movement: StockMovementListItem) => void;
};

export function StockMovementRowActions({
  movement,
  onView,
}: StockMovementRowActionsProps) {
  return (
    <RowActionsMenu
      ariaLabel={`Ações da movimentação ${movement.id}`}
      items={[
        {
          id: "view",
          label: "Visualizar",
          icon: <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />,
          onClick: () => onView(movement),
        },
      ]}
    />
  );
}
