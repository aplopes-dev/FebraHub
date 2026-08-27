"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import AddIcon from "@mui/icons-material/Add";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, EmptyState } from "@/ui";
import { SemanticBadge } from "@/components/ui/status";
import { UnitAvatar } from "@/features/branches/components/unit-avatar";
import { UnitRowActions } from "@/features/branches/components/unit-row-actions";
import {
  documentLabel,
  UNIT_KIND_LABELS,
  type Branch,
  type OrganizationStructure,
} from "@/features/branches/types/branch";

type OrganizationUnitsAccordionProps = {
  structure: OrganizationStructure | null;
  isFetching?: boolean;
  isSearchActive?: boolean;
  onDeleteMatrix: (id: string) => void | Promise<void>;
  onDeleteStore: (id: string) => void | Promise<void>;
};

function storeCountLabel(count: number): string {
  if (count === 0) return "Nenhuma filial";
  if (count === 1) return "1 filial";
  return `${count} filiais`;
}

function FilialRow({
  store,
  onDelete,
}: {
  store: Branch;
  onDelete: (id: string) => void | Promise<void>;
}) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{
        alignItems: "center",
        py: 1.5,
        px: 2,
        minWidth: 0,
      }}
    >
      <UnitAvatar unit={store} size={36} />
      <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {store.displayName}
          </Typography>
          <SemanticBadge label={UNIT_KIND_LABELS.store} tone="neutral" />
        </Stack>
        <Typography variant="caption" color="text.secondary" noWrap>
          {store.code} · {store.legalName}
        </Typography>
      </Stack>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ display: { xs: "none", sm: "block" }, minWidth: 140 }}
        noWrap
      >
        {store.document || "—"}
      </Typography>
      <UnitRowActions unit={store} onDelete={onDelete} />
    </Stack>
  );
}

function MatrixAccordionPanel({
  matrix,
  stores,
  expanded,
  onExpandedChange,
  onDeleteMatrix,
  onDeleteStore,
}: {
  matrix: Branch;
  stores: Branch[];
  expanded: boolean;
  onExpandedChange: (matrixId: string, nextExpanded: boolean) => void;
  onDeleteMatrix: (id: string) => void | Promise<void>;
  onDeleteStore: (id: string) => void | Promise<void>;
}) {
  return (
    <Accordion
      expanded={expanded}
      onChange={(_, nextExpanded) => onExpandedChange(matrix.id, nextExpanded)}
      disableGutters
      elevation={0}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: "8px !important",
        overflow: "hidden",
        "&:before": { display: "none" },
        "&.Mui-expanded": { margin: 0 },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          px: 2,
          minHeight: 72,
          "& .MuiAccordionSummary-content": {
            alignItems: "center",
            gap: 2,
            my: 1.5,
          },
        }}
      >
        <UnitAvatar unit={matrix} />
        <Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }} noWrap>
            {matrix.displayName} · {storeCountLabel(stores.length)}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {matrix.code} · {matrix.tradeName || matrix.legalName} ·{" "}
            {matrix.document || "—"}
          </Typography>
        </Stack>
        <Box
          sx={{ flexShrink: 0 }}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <UnitRowActions unit={matrix} onDelete={onDeleteMatrix} />
        </Box>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 0, bgcolor: "action.hover" }}>
        {stores.length === 0 ? (
          <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Esta matriz ainda não tem filiais cadastradas.
            </Typography>
            <Button
              component={Link}
              href={`/settings/units/matrices/${matrix.id}/stores/new`}
              size="small"
              startIcon={<AddIcon />}
            >
              Adicionar filial
            </Button>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                display: { xs: "none", sm: "grid" },
                gridTemplateColumns: "1fr 140px minmax(200px, auto)",
                gap: 2,
                px: 2,
                py: 1,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                Filial
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {documentLabel(matrix.personType)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 600, textAlign: "right" }}
              >
                Ações
              </Typography>
            </Box>
            {stores.map((store, index) => (
              <Box key={store.id}>
                {index > 0 ? <Divider /> : null}
                <FilialRow store={store} onDelete={onDeleteStore} />
              </Box>
            ))}
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

function AccordionSkeleton() {
  return (
    <Stack spacing={1.5}>
      {[0, 1].map((key) => (
        <Skeleton key={key} variant="rounded" height={72} />
      ))}
    </Stack>
  );
}

export function OrganizationUnitsAccordion({
  structure,
  isFetching = false,
  isSearchActive = false,
  onDeleteMatrix,
  onDeleteStore,
}: OrganizationUnitsAccordionProps) {
  const matrices = structure?.matrices ?? [];
  const matrixIds = useMemo(
    () => matrices.map((matrix) => matrix.id),
    [matrices],
  );

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (matrixIds.length === 0) {
      setExpandedIds([]);
      initializedRef.current = false;
      return;
    }

    if (isSearchActive) {
      setExpandedIds(matrixIds);
      return;
    }

    setExpandedIds((current) => {
      if (!initializedRef.current) {
        initializedRef.current = true;
        return matrixIds;
      }

      const known = current.filter((id) => matrixIds.includes(id));
      const added = matrixIds.filter((id) => !current.includes(id));
      return [...known, ...added];
    });
  }, [matrixIds, isSearchActive]);

  function handleExpandedChange(matrixId: string, nextExpanded: boolean) {
    setExpandedIds((current) =>
      nextExpanded
        ? current.includes(matrixId)
          ? current
          : [...current, matrixId]
        : current.filter((id) => id !== matrixId),
    );
  }

  if (isFetching && !structure) {
    return <AccordionSkeleton />;
  }

  if (matrices.length === 0) {
    return (
      <EmptyState
        icon={<BusinessOutlinedIcon sx={{ fontSize: 40 }} />}
        title="Nenhuma empresa matriz cadastrada"
        description="Cadastre a primeira matriz do grupo. Depois você poderá adicionar filiais dentro de cada uma."
        action={
          <Button
            component={Link}
            href="/settings/units/matrices/new"
            variant="contained"
            startIcon={<AddIcon />}
          >
            Adicionar primeira matriz
          </Button>
        }
      />
    );
  }

  return (
    <Stack spacing={1.5}>
      {matrices.map((matrix) => {
        const stores = structure?.storesByMatrix[matrix.id] ?? [];
        return (
          <MatrixAccordionPanel
            key={matrix.id}
            matrix={matrix}
            stores={stores}
            expanded={expandedIds.includes(matrix.id)}
            onExpandedChange={handleExpandedChange}
            onDeleteMatrix={onDeleteMatrix}
            onDeleteStore={onDeleteStore}
          />
        );
      })}
    </Stack>
  );
}
