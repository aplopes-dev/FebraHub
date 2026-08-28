"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Avatar,
  Badge,
  Box,
  Button,
  Grid,
  MenuItem,
  PageHeader,
  Paper,
  SearchInput,
  Select,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from "@/ui";
import { DataTable, ListPagePanel, type DataTableColumn } from "@/components/ui/data-table";
import { Page } from "@/components/ui/page";
import { SemanticBadge, type SemanticTone } from "@/components/ui/status";
import { ConvertLeadDialog } from "@/features/leads/components/convert-lead-dialog";
import {
  useAssignLeadMutation,
  useConvertLeadMutation,
  useLeadsBoard,
} from "@/features/leads/hooks/use-leads";
import { getConversionOptions } from "@/features/leads/services/leads.service";
import type { LeadRow } from "@/features/leads/types/lead-view";
import { originLabel } from "@/features/pipeline/components/origin-chip";
import { formatPhone } from "@/lib/br-format";
import { formatIsoDate } from "@/lib/date";

const STATUS_TONE: Record<string, { label: string; tone: SemanticTone }> = {
  novo: { label: "Novo", tone: "info" },
  em_contato: { label: "Em contato", tone: "warning" },
  convertido: { label: "Convertido", tone: "success" },
  descartado: { label: "Descartado", tone: "neutral" },
};

function formatWait(row: LeadRow): string {
  if (row.firstContactMinutes !== undefined) {
    const minutes = row.firstContactMinutes;
    if (minutes < 60) return `${minutes} min`;
    return `${Math.round(minutes / 60)} h`;
  }
  return `${row.waitingHours} h esperando`;
}

/**
 * Leads — a porta de entrada.
 *
 * A tela existe para responder duas perguntas antes de qualquer outra:
 * **quem ainda não tem dono** e **quem está esperando resposta há tempo
 * demais**. Volume por canal vem depois; ele não muda o que fazer agora.
 */
export function LeadsPage() {
  const { filters, patchFilters, search, setSearch, board, isLoading } = useLeadsBoard();
  const assignMutation = useAssignLeadMutation();
  const convertMutation = useConvertLeadMutation();
  const [target, setTarget] = useState<LeadRow | null>(null);
  const owners = getConversionOptions().owners;

  const columns: DataTableColumn<LeadRow>[] = [
    {
      id: "person",
      header: "Pessoa",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {row.personName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {formatPhone(row.personPhone)} · {row.personCity}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "origin",
      header: "Origem",
      render: (row) => (
        <Stack spacing={0.25}>
          <Typography variant="body2">{originLabel(row.origin.channel)}</Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {row.origin.campaign ?? "sem campanha"}
          </Typography>
        </Stack>
      ),
    },
    {
      id: "interest",
      header: "Interesse",
      render: (row) => (
        <Typography variant="body2">{row.interestName ?? "—"}</Typography>
      ),
    },
    {
      id: "received",
      header: "Chegou",
      render: (row) => (
        <Typography variant="body2">{formatIsoDate(row.lead.receivedAt)}</Typography>
      ),
    },
    {
      id: "sla",
      header: "1º contato",
      render: (row) => (
        <Tooltip
          title={
            row.firstContactMinutes === undefined
              ? "Ninguém falou com esta pessoa ainda."
              : "Tempo entre a chegada do lead e o primeiro contato."
          }
          arrow
        >
          <Typography
            variant="body2"
            sx={{
              color: row.slaBreached ? "error.main" : "text.primary",
              fontWeight: row.slaBreached ? 600 : 400,
            }}
          >
            {formatWait(row)}
          </Typography>
        </Tooltip>
      ),
    },
    {
      id: "owner",
      header: "Dono",
      render: (row) =>
        row.ownerInitials ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Avatar sx={{ width: 26, height: 26, fontSize: "0.6875rem" }}>
              {row.ownerInitials}
            </Avatar>
            <Typography variant="body2" noWrap>
              {row.ownerName}
            </Typography>
          </Stack>
        ) : (
          <Select
            size="small"
            value=""
            displayEmpty
            onChange={(event) =>
              assignMutation.mutate({
                leadId: row.lead.id,
                ownerId: String(event.target.value),
              })
            }
            sx={{ minWidth: 150 }}
            inputProps={{ "aria-label": "Atribuir dono" }}
          >
            <MenuItem value="" disabled>
              Sem dono
            </MenuItem>
            {owners.map((owner) => (
              <MenuItem key={owner.id} value={owner.id}>
                {owner.name}
              </MenuItem>
            ))}
          </Select>
        ),
    },
    {
      id: "status",
      header: "Situação",
      render: (row) => {
        const item = STATUS_TONE[row.lead.status];
        return item ? <SemanticBadge label={item.label} tone={item.tone} /> : null;
      },
    },
    {
      id: "actions",
      header: "",
      align: "right",
      render: (row) =>
        row.lead.status === "convertido" ? (
          <Button
            component={Link}
            href={`/comercial/oportunidades/${row.lead.opportunityId}`}
            size="small"
            variant="text"
          >
            Ver oportunidade
          </Button>
        ) : (
          <Button
            type="button"
            size="small"
            variant="outlined"
            onClick={() => setTarget(row)}
          >
            Converter
          </Button>
        ),
    },
  ];

  return (
    <Page scroll={false}>
      <PageHeader
        title="Leads"
        description="Quem chegou, por onde, e em quanto tempo foi atendido."
      />

      {board ? (
        <Grid container spacing={2}>
          <SummaryCard
            label="Leads na base"
            value={String(board.summary.total)}
            hint={`${board.summary.convertedPercent}% já viraram oportunidade`}
          />
          <SummaryCard
            label="Sem dono"
            value={String(board.summary.orphans)}
            hint="Ninguém assumiu — mídia esfriando"
            tone={board.summary.orphans > 0 ? "warning" : "neutral"}
          />
          <SummaryCard
            label="1º contato (mediana)"
            value={
              board.summary.medianFirstContactMinutes !== undefined
                ? `${board.summary.medianFirstContactMinutes} min`
                : "—"
            }
            hint="Metade é atendida mais rápido que isso"
          />
          <SummaryCard
            label="Fora do SLA"
            value={String(board.summary.slaBreached)}
            hint="Passou de 4 h até o primeiro contato"
            tone={board.summary.slaBreached > 0 ? "warning" : "neutral"}
          />
        </Grid>
      ) : null}

      <ListPagePanel sx={{ gap: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1.5}
          sx={{ alignItems: { md: "center" } }}
        >
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por pessoa ou campanha…"
            sx={{ width: "100%", maxWidth: 300 }}
            slotProps={{ htmlInput: { "aria-label": "Buscar leads" } }}
          />

          <Select
            size="small"
            value={filters.status}
            onChange={(event) =>
              patchFilters({ status: event.target.value as typeof filters.status })
            }
            sx={{ minWidth: 160 }}
            inputProps={{ "aria-label": "Situação" }}
          >
            <MenuItem value="todos">Todas as situações</MenuItem>
            <MenuItem value="novo">Novos</MenuItem>
            <MenuItem value="em_contato">Em contato</MenuItem>
            <MenuItem value="convertido">Convertidos</MenuItem>
            <MenuItem value="descartado">Descartados</MenuItem>
          </Select>

          <Select
            size="small"
            value={filters.channel}
            onChange={(event) =>
              patchFilters({ channel: event.target.value as typeof filters.channel })
            }
            sx={{ minWidth: 160 }}
            inputProps={{ "aria-label": "Canal" }}
          >
            <MenuItem value="todos">Todos os canais</MenuItem>
            {(board?.channels ?? []).map((item) => (
              <MenuItem key={item.channel} value={item.channel}>
                {originLabel(item.channel)} ({item.count})
              </MenuItem>
            ))}
          </Select>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Switch
              size="small"
              checked={filters.onlyOrphans}
              onChange={(event) => patchFilters({ onlyOrphans: event.target.checked })}
              slotProps={{ input: { "aria-label": "Somente sem dono" } }}
            />
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Somente sem dono
            </Typography>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {(board?.channels ?? []).slice(0, 6).map((item) => (
            <Badge
              key={item.channel}
              label={`${originLabel(item.channel)}: ${item.count} · ${item.conversionPercent}% convertem`}
              size="small"
              variant="outlined"
              sx={{ borderColor: "divider", color: "text.secondary" }}
            />
          ))}
        </Stack>

        <DataTable
          columns={columns}
          rows={board?.rows ?? []}
          getRowId={(row) => row.lead.id}
          isLoading={isLoading}
          emptyMessage="Nenhum lead neste recorte."
          pageScroll
        />
      </ListPagePanel>

      <ConvertLeadDialog
        key={target?.lead.id ?? "fechado"}
        open={Boolean(target)}
        personName={target?.personName}
        defaultProductId={target?.lead.interestProductId}
        defaultOwnerId={target?.lead.ownerId}
        onCancel={() => setTarget(null)}
        onConfirm={(input) => {
          if (!target) return;
          convertMutation.mutate({ leadId: target.lead.id, ...input });
          setTarget(null);
        }}
      />
    </Page>
  );
}

function SummaryCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "neutral" | "warning";
}) {
  return (
    <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
        <Stack spacing={0.5}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {label}
          </Typography>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              lineHeight: 1.15,
              color: tone === "warning" ? "warning.dark" : "text.primary",
            }}
          >
            {value}
          </Typography>
          <Box>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              {hint}
            </Typography>
          </Box>
        </Stack>
      </Paper>
    </Grid>
  );
}
