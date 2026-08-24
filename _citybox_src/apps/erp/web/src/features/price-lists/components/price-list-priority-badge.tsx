"use client";

import StarOutlined from "@mui/icons-material/StarOutlined";

import { Badge, Typography } from "@citybox/mui";
type PriceListPriorityBadgeProps = {
  rank: number;
};

export function PriceListPriorityBadge({ rank }: PriceListPriorityBadgeProps) {
  if (rank === 1) {
    return (
      <Badge
        color="primary"
        variant="outlined"
        icon={<StarOutlined sx={{ fontSize: 14 }} />}
        label="Prioritária"
        sx={{ fontWeight: 500 }}
      />
    );
  }

  return (
    <Typography variant="body2" sx={{ color: "text.secondary" }}>
      {rank}ª
    </Typography>
  );
}
