"use client";

import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {
  Badge,
  Button,
  MenuItem,
  SearchInput,
  Select,
  Tooltip,
} from "@/ui";
import type {
  PipelineBoard,
  PipelineFilters,
  PipelineQuickFilter,
  PipelineView,
} from "@/features/pipeline/types/pipeline-view";
import type { getPipelineOptions } from "@/features/pipeline/services/pipeline.service";

type Options = ReturnType<typeof getPipelineOptions>;

export type PipelineToolbarProps = {
  view: PipelineView;
  onViewChange: (view: PipelineView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  filters: PipelineFilters;
  onFiltersChange: (patch: Partial<PipelineFilters>) => void;
  onQuickChange: (quick: PipelineQuickFilter) => void;
  options: Options;
  summary?: PipelineBoard["summary"];
  hasActiveFilters: boolean;
  onClearFilters: () => void;
};

/**
 * Os recortes rápidos não são enfeite: cada um é um buraco conhecido do funil
 * (parada, sem próxima ação, follow-up vencido, desconto travado na alçada).
 * Eles ficam à mão porque é o que o gestor abre a tela para procurar.
 */
const QUICK_FILTERS: Array<{
  id: PipelineQuickFilter;
  label: string;
  tone: "warning" | "error" | "info";
  count: (summary: PipelineBoard["summary"]) => number;
  hint: string;
}> = [
  {
    id: "paradas",
    label: "Paradas",
    tone: "error",
    count: (summary) => summary.stalledCount,
    hint: "Sem mudar de etapa há 14 dias ou mais.",
  },
  {
    id: "acao_vencida",
    label: "Follow-up vencido",
    tone: "error",
    count: (summary) => summary.overdueActionCount,
    hint: "A próxima ação passou do prazo.",
  },
  {
    id: "sem_acao",
    label: "Sem próxima ação",
    tone: "warning",
    count: (summary) => summary.withoutActionCount,
    hint: "Aberta e sem nada agendado — some do radar.",
  },
  {
    id: "aguardando_aprovacao",
    label: "Aguardando aprovação",
    tone: "info",
    count: (summary) => summary.awaitingApprovalCount,
    hint: "Desconto acima da alçada, esperando decisão.",
  },
];

export function PipelineToolbar({
  view,
  onViewChange,
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  onQuickChange,
  options,
  summary,
  hasActiveFilters,
  onClearFilters,
}: PipelineToolbarProps) {
  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={1.5}
        sx={{ alignItems: { lg: "center" }, justifyContent: "space-between" }}
      >
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <SearchInput
            size="small"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por pessoa, produto ou consultor…"
            sx={{ width: "100%", maxWidth: 300 }}
            slotProps={{ htmlInput: { "aria-label": "Buscar oportunidades" } }}
          />

          <Select
            size="small"
            value={filters.funnelId}
            onChange={(event) => onFiltersChange({ funnelId: String(event.target.value) })}
            sx={{ minWidth: 190 }}
            inputProps={{ "aria-label": "Funil" }}
          >
            {options.funnels.map((funnel) => (
              <MenuItem key={funnel.id} value={funnel.id}>
                {funnel.name}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={filters.ownerId}
            onChange={(event) => onFiltersChange({ ownerId: String(event.target.value) })}
            sx={{ minWidth: 170 }}
            inputProps={{ "aria-label": "Responsável" }}
          >
            <MenuItem value="todos">Todos os consultores</MenuItem>
            {options.owners.map((owner) => (
              <MenuItem key={owner.id} value={owner.id}>
                {owner.name}
              </MenuItem>
            ))}
          </Select>

          <Select
            size="small"
            value={filters.productId}
            onChange={(event) => onFiltersChange({ productId: String(event.target.value) })}
            sx={{ minWidth: 180 }}
            inputProps={{ "aria-label": "Produto" }}
          >
            <MenuItem value="todos">Todos os produtos</MenuItem>
            {options.products.map((product) => (
              <MenuItem key={product.id} value={product.id}>
                {product.shortName}
              </MenuItem>
            ))}
          </Select>

          {hasActiveFilters ? (
            <Button type="button" variant="text" onClick={onClearFilters}>
              Limpar
            </Button>
          ) : null}
        </Stack>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={view}
          onChange={(_event, next) => {
            if (next) onViewChange(next as PipelineView);
          }}
          aria-label="Modo de visualização"
        >
          <ToggleButton value="kanban" aria-label="Quadro">
            <ViewKanbanOutlinedIcon sx={{ fontSize: 18, mr: 0.5 }} /> Quadro
          </ToggleButton>
          <ToggleButton value="lista" aria-label="Lista">
            <FormatListBulletedIcon sx={{ fontSize: 18, mr: 0.5 }} /> Lista
          </ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {summary ? (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {QUICK_FILTERS.map((quick) => {
            const count = quick.count(summary);
            const active = filters.quick === quick.id;
            return (
              <Tooltip key={quick.id} title={quick.hint} arrow>
                <Badge
                  clickable
                  onClick={() => onQuickChange(quick.id)}
                  label={`${quick.label} · ${count}`}
                  variant={active ? "filled" : "outlined"}
                  size="small"
                  sx={{
                    cursor: "pointer",
                    fontWeight: 600,
                    borderColor: count > 0 ? `${quick.tone}.main` : "divider",
                    color: active
                      ? `${quick.tone}.dark`
                      : count > 0
                        ? `${quick.tone}.dark`
                        : "text.disabled",
                    bgcolor: active ? `${quick.tone}.light` : "transparent",
                  }}
                />
              </Tooltip>
            );
          })}
        </Stack>
      ) : null}
    </Stack>
  );
}
