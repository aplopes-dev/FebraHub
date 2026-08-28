"use client";

import Link from "next/link";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import GavelIcon from "@mui/icons-material/Gavel";
import { Avatar, Badge, Stack, Tooltip, Typography } from "@/ui";
import { OriginChip } from "@/features/pipeline/components/origin-chip";
import type { OpportunityRow } from "@/features/pipeline/types/pipeline-view";
import { formatCents, formatPercent } from "@/lib/money";

/**
 * O card do funil.
 *
 * Ele responde três perguntas em um olhar: **quem**, **quanto** e **o que
 * fazer agora**. O que não responde a isso não entra — card de CRM cheio de
 * campo vira parede que ninguém lê.
 */
export function OpportunityCard({ row }: { row: OpportunityRow }) {
  return (
    <Stack
      component={Link}
      href={`/comercial/oportunidades/${row.id}`}
      spacing={1}
      sx={{ textDecoration: "none", color: "inherit" }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, flex: 1, minWidth: 0, lineHeight: 1.3 }}
        >
          {row.personName}
        </Typography>
        <Tooltip title={row.ownerName} arrow>
          <Avatar sx={{ width: 24, height: 24, fontSize: "0.6875rem" }}>
            {row.ownerInitials}
          </Avatar>
        </Tooltip>
      </Stack>

      <Typography variant="caption" sx={{ color: "text.secondary" }}>
        {row.productShortName}
        {row.editionName ? ` · ${row.editionName.split("—")[1]?.trim() ?? ""}` : ""}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ alignItems: "baseline" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {formatCents(row.amountCents)}
        </Typography>
        {row.discountPercent > 0 ? (
          <Tooltip
            title={`Tabela ${formatCents(row.listPriceCents)} — desconto de ${formatPercent(row.discountPercent)}`}
            arrow
          >
            <Typography variant="caption" sx={{ color: "warning.dark" }}>
              −{formatPercent(row.discountPercent)}
            </Typography>
          </Tooltip>
        ) : null}
      </Stack>

      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
        <OriginChip origin={row.origin} />
        {row.proposalStatus === "aguardando_aprovacao" ? (
          <Badge
            icon={<GavelIcon sx={{ fontSize: 12 }} />}
            label="Aprovação"
            variant="outlined"
            size="small"
            sx={{
              height: 20,
              fontSize: "0.6875rem",
              bgcolor: "warning.light",
              color: "warning.dark",
              borderColor: "warning.main",
            }}
          />
        ) : null}
      </Stack>

      {row.status !== "aberta" ? (
        <Typography
          variant="caption"
          sx={{
            color: row.status === "ganha" ? "success.dark" : "text.disabled",
            fontWeight: row.status === "ganha" ? 600 : 400,
          }}
        >
          {row.status === "ganha" ? "Matrícula fechada" : "Encerrada"} ·{" "}
          {row.daysInStage === 0 ? "hoje" : `há ${row.daysInStage} d`}
        </Typography>
      ) : (
        <>
      <Stack
        direction="row"
        spacing={0.75}
        sx={{ alignItems: "center", color: "text.secondary" }}
      >
        {row.nextAction ? (
          <>
            <AccessTimeIcon
              sx={{
                fontSize: 13,
                color: row.nextAction.overdue ? "error.main" : "text.disabled",
              }}
            />
            <Typography
              variant="caption"
              sx={{
                color: row.nextAction.overdue ? "error.main" : "text.secondary",
                fontWeight: row.nextAction.overdue ? 600 : 400,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {row.nextAction.title}
            </Typography>
          </>
        ) : (
          <>
            <WarningAmberIcon sx={{ fontSize: 13, color: "warning.main" }} />
            <Typography variant="caption" sx={{ color: "warning.dark" }}>
              Sem próxima ação
            </Typography>
          </>
        )}
      </Stack>

      {row.stalled ? (
        <Typography variant="caption" sx={{ color: "error.main", fontWeight: 600 }}>
          Parada há {row.daysInStage} dias
        </Typography>
      ) : (
        <Typography variant="caption" sx={{ color: "text.disabled" }}>
          {row.daysInStage === 0 ? "Movida hoje" : `${row.daysInStage} d nesta etapa`}
        </Typography>
      )}
        </>
      )}
    </Stack>
  );
}
