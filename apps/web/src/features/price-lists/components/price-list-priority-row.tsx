"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { Box, Button, Typography } from "@/ui";
import { PriceListStatusBadge } from "@/features/price-lists/components/price-list-status-badge";
import {
  formatAdjustmentRule,
  formatChannelsSummary,
} from "@/features/price-lists/lib/price-list-format";
import type { PriceList } from "@/features/price-lists/types/price-list";

type PriceListPriorityRowProps = {
  priceList: PriceList;
  position: number;
};

export function PriceListPriorityRow({
  priceList,
  position,
}: PriceListPriorityRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: priceList.id });

  return (
    <Box
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      sx={{
        zIndex: isDragging ? 1 : 0,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 1.5,
        py: 1.5,
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        opacity: isDragging ? 0.85 : 1,
        boxShadow: isDragging ? 2 : 0,
      }}
    >
      <Button
        type="button"
        variant="text"
        aria-label={`Reordenar ${priceList.name}`}
        sx={{
          minWidth: 32,
          px: 0.5,
          cursor: "grab",
          color: "text.secondary",
          "&:active": { cursor: "grabbing" },
        }}
        {...attributes}
        {...listeners}
      >
        <DragIndicatorIcon sx={{ fontSize: 16 }} aria-hidden />
      </Button>

      <Typography
        variant="body2"
        sx={{
          width: 24,
          flexShrink: 0,
          textAlign: "center",
          fontWeight: 600,
          color: "text.secondary",
        }}
      >
        {position}
      </Typography>

      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {priceList.name}
        </Typography>
        <Typography variant="caption" noWrap sx={{ color: "text.secondary" }}>
          {formatAdjustmentRule(priceList)} · {formatChannelsSummary(priceList)}
        </Typography>
      </Box>

      <PriceListStatusBadge active={priceList.active} />
    </Box>
  );
}
