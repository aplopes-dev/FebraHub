"use client";

import { useState } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Drawer, Select } from "@/ui";
import { resolveFiscalDocumentStatusLabel } from "@/features/facilita-nfe/lib/fiscal-document-format";
import {
  createEmptyFacilitaNfeIssuedFilters,
  FISCAL_DOCUMENT_STATUSES,
  FISCAL_DOCUMENT_TYPES,
  type FacilitaNfeIssuedFilters,
} from "@/features/facilita-nfe/types/fiscal-document";
import { FISCAL_DOCUMENT_TYPE_LABELS } from "@/features/facilita-nfe/lib/fiscal-document-format";

type FacilitaNfeFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FacilitaNfeIssuedFilters;
  onApply: (filters: FacilitaNfeIssuedFilters) => void;
};

/** Filtro por status/tipo — resolvido no backend (FR-005), sem filtro no cliente. */
export function FacilitaNfeFiltersDrawer({
  open,
  onOpenChange,
  value,
  onApply,
}: FacilitaNfeFiltersDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Filtrar documentos emitidos"
      width={360}
    >
      <FacilitaNfeFiltersDrawerBody
        key={open ? "open" : "closed"}
        value={value}
        onClose={() => onOpenChange(false)}
        onApply={onApply}
      />
    </Drawer>
  );
}

function FacilitaNfeFiltersDrawerBody({
  value,
  onClose,
  onApply,
}: {
  value: FacilitaNfeIssuedFilters;
  onClose: () => void;
  onApply: (filters: FacilitaNfeIssuedFilters) => void;
}) {
  const [draft, setDraft] = useState<FacilitaNfeIssuedFilters>({ ...value });

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClear() {
    setDraft(createEmptyFacilitaNfeIssuedFilters());
  }

  return (
    <>
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Refine por status ou tipo de documento fiscal.
      </Typography>

      <Stack spacing={3}>
        <FormControl fullWidth size="small">
          <InputLabel id="facilita-nfe-status-label">Status</InputLabel>
          <Select
            labelId="facilita-nfe-status-label"
            label="Status"
            value={draft.status ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                status: (event.target.value as FacilitaNfeIssuedFilters["status"]) || null,
              }))
            }
          >
            <MenuItem value="">Todos os status</MenuItem>
            {FISCAL_DOCUMENT_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {resolveFiscalDocumentStatusLabel(status)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel id="facilita-nfe-type-label">Modelo</InputLabel>
          <Select
            labelId="facilita-nfe-type-label"
            label="Modelo"
            value={draft.documentType ?? ""}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                documentType:
                  (event.target.value as FacilitaNfeIssuedFilters["documentType"]) || null,
              }))
            }
          >
            <MenuItem value="">Todos os modelos</MenuItem>
            {FISCAL_DOCUMENT_TYPES.map((type) => (
              <MenuItem key={type} value={type}>
                {FISCAL_DOCUMENT_TYPE_LABELS[type]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Button type="button" variant="outlined" fullWidth onClick={handleClear}>
          Limpar
        </Button>
        <Button type="button" variant="contained" fullWidth onClick={handleApply}>
          Aplicar
        </Button>
      </Stack>
    </>
  );
}
