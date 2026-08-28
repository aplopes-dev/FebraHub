"use client";

import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import PieChartOutlineIcon from "@mui/icons-material/PieChartOutlineOutlined";
import { Box } from "@/ui";
import { KpiChip } from "@/features/commercial-overview/components/kpi-chip";
import type { CommercialOverview } from "@/features/commercial-overview/services/overview.service";
import { formatCents, formatCentsCompact, formatPercent } from "@/lib/money";

const ICON = { fontSize: 15 } as const;

/**
 * A faixa de números do mês.
 *
 * Um único chip é `hero` — o valor praticado. Os outros qualificam esse
 * número: quantas matrículas o produziram, a que ticket, contra que ano, com
 * quanto de desconto. Faixa toda destacada não destaca nada.
 */
export function OverviewKpis({ overview }: { overview: CommercialOverview }) {
  const { kpis, periodLabel } = overview;

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1,
        // `auto-fit` em vez de contagem fixa: sete chips numa grade de seis
        // deixavam um órfão na segunda linha em telas largas.
        gridTemplateColumns: "repeat(auto-fit, minmax(196px, 1fr))",
      }}
    >
      <KpiChip
        hero
        icon={<PaidOutlinedIcon sx={ICON} />}
        label="Praticado no mês"
        value={formatCentsCompact(kpis.enrollmentsCents)}
        note={periodLabel}
        sub={`tabela: ${formatCentsCompact(kpis.listCents)}`}
      />
      <KpiChip
        icon={<ReceiptLongOutlinedIcon sx={ICON} />}
        label="Matrículas"
        value={String(kpis.enrollmentsCount)}
        note="mês parcial"
      />
      <KpiChip
        icon={<TrendingUpIcon sx={ICON} />}
        label="Ticket médio"
        value={kpis.averageTicketCents != null ? formatCents(kpis.averageTicketCents) : "—"}
        note="praticado ÷ matrículas"
      />
      <KpiChip
        icon={<TrendingUpIcon sx={ICON} />}
        label="vs. ano passado"
        value={
          kpis.yoyPercent != null
            ? `${kpis.yoyPercent >= 0 ? "+" : "−"}${Math.abs(kpis.yoyPercent).toFixed(0)}%`
            : "—"
        }
        delta={kpis.yoyPercent != null ? `${Math.abs(kpis.yoyPercent).toFixed(0)}%` : null}
        up={kpis.yoyPercent != null && kpis.yoyPercent >= 0}
        note={kpis.yoyPercent == null ? "sem base para comparar" : undefined}
      />
      <KpiChip
        icon={<PieChartOutlineIcon sx={ICON} />}
        label="Pipeline aberto"
        value={formatCentsCompact(kpis.openCents)}
        note={`${kpis.openCount} oportunidades`}
      />
      <KpiChip
        icon={<PercentOutlinedIcon sx={ICON} />}
        label="Desconto médio"
        value={formatPercent(kpis.averageDiscountPercent)}
        note="sobre a tabela"
        sub={`vitória: ${formatPercent(kpis.winRatePercent)}`}
      />
      <KpiChip
        icon={<BoltOutlinedIcon sx={ICON} />}
        label="Leads"
        value={String(kpis.leadsCount)}
        note={kpis.leadsWithoutOwner > 0 ? `${kpis.leadsWithoutOwner} sem dono` : "todos com dono"}
      />
    </Box>
  );
}
