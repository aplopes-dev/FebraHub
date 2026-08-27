"use client";

import Check from "@mui/icons-material/Check";
import Inventory2Outlined from "@mui/icons-material/Inventory2Outlined";
import LocalOfferOutlined from "@mui/icons-material/LocalOfferOutlined";
import ScheduleOutlined from "@mui/icons-material/ScheduleOutlined";
import StorefrontOutlined from "@mui/icons-material/StorefrontOutlined";
import Tune from "@mui/icons-material/Tune";
import { useMemo, type ReactNode } from "react";
import { Badge, Box, Stack, Typography } from "@/ui";
import { PriceListStatusBadge } from "@/features/price-lists/components/price-list-status-badge";
import { useBranchUnits } from "@/features/products/hooks/use-branch-units";
import {
  formatAdjustmentRule,
  formatValidity,
  getPriceListBranchLabels,
  getPriceListChannelLabels,
} from "@/features/price-lists/lib/price-list-format";
import { surfaceBorderRadius } from "@/theme/surface-styles";
import type { PriceList } from "@/features/price-lists/types/price-list";

type PriceListInfoCardsProps = {
  priceList: PriceList;
  productCount: number;
};

const INFO_CARD_ICONS = {
  sliders: Tune,
  clock: ScheduleOutlined,
  package: Inventory2Outlined,
  check: Check,
} as const;

function InfoCard({
  icon,
  label,
  children,
}: {
  icon: keyof typeof INFO_CARD_ICONS;
  label: string;
  children: ReactNode;
}) {
  const IconComponent = INFO_CARD_ICONS[icon];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: surfaceBorderRadius,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: surfaceBorderRadius,
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      >
        <IconComponent sx={{ fontSize: 16 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          {label}
        </Typography>
        <Box sx={{ mt: 0.5, typography: "body2", fontWeight: 500 }}>{children}</Box>
      </Box>
    </Box>
  );
}

function ScopeCard({
  icon,
  label,
  emptyLabel,
  values,
}: {
  icon: ReactNode;
  label: string;
  emptyLabel: string;
  values: string[];
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.5,
        p: 2,
        border: 1,
        borderColor: "divider",
        borderRadius: surfaceBorderRadius,
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          width: 36,
          height: 36,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: surfaceBorderRadius,
          bgcolor: "action.hover",
          color: "text.secondary",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 500,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          {label}
        </Typography>
        {values.length > 0 ? (
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ flexWrap: "wrap", mt: 1, gap: 0.75 }}
          >
            {values.map((value) => (
              <Badge
                key={value}
                label={value}
                color="muted"
                sx={{ fontWeight: 500 }}
              />
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
            {emptyLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export function PriceListInfoCards({
  priceList,
  productCount,
}: PriceListInfoCardsProps) {
  const units = useBranchUnits();
  const branchNameById = useMemo(
    () => new Map(units.map((unit) => [unit.id, unit.name])),
    [units],
  );
  const channelLabels = getPriceListChannelLabels(priceList);
  const branchLabels = getPriceListBranchLabels(priceList, branchNameById);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      <InfoCard icon="sliders" label="Regra de ajuste">
        {formatAdjustmentRule(priceList)}
      </InfoCard>
      <InfoCard icon="clock" label="Vigência">
        {formatValidity(priceList)}
      </InfoCard>
      <InfoCard icon="package" label="Produtos">
        {productCount} produto{productCount === 1 ? "" : "s"}
      </InfoCard>
      <InfoCard icon="check" label="Status">
        <PriceListStatusBadge active={priceList.active} />
      </InfoCard>
      <Box
        sx={{
          gridColumn: { sm: "1 / -1" },
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <ScopeCard
          icon={<LocalOfferOutlined sx={{ fontSize: 16 }} />}
          label="Canais de venda"
          emptyLabel="Todos os canais"
          values={channelLabels}
        />
        <ScopeCard
          icon={<StorefrontOutlined sx={{ fontSize: 16 }} />}
          label="Unidades"
          emptyLabel="Todas as unidades"
          values={branchLabels}
        />
      </Box>
    </Box>
  );
}
