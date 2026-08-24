"use client";

import NorthEastOutlined from "@mui/icons-material/NorthEastOutlined";
import SouthWestOutlined from "@mui/icons-material/SouthWestOutlined";
import Stack from "@mui/material/Stack";
import { Badge } from "@citybox/mui";
import {
  FINANCIAL_GROUP_TYPE_LABELS,
  type FinancialGroupType,
} from "@/features/financial-groups/types/financial-group";

type FinancialGroupTypeBadgeProps = {
  type: FinancialGroupType;
};

export function FinancialGroupTypeBadge({
  type,
}: FinancialGroupTypeBadgeProps) {
  const isReceita = type === "receita";

  return (
    <Badge
      label={
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          {isReceita ? (
            <SouthWestOutlined sx={{ fontSize: 14 }} />
          ) : (
            <NorthEastOutlined sx={{ fontSize: 14 }} />
          )}
          <span>{FINANCIAL_GROUP_TYPE_LABELS[type]}</span>
        </Stack>
      }
      color={isReceita ? "success" : "error"}
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
}
