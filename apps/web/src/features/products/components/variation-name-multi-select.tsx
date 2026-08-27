"use client";

import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, SearchInput } from "@/ui";
import type { Variation } from "@/features/variations/types/variation";

type VariationNameMultiSelectProps = {
  variations: Variation[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  onCreateNew: () => void;
  label?: string;
};

/**
 * Combobox multi-select inline (sem portal).
 * Popover/Portal dentro do Drawer (Vaul) fecha no clique e impede a seleção.
 */
export function VariationNameMultiSelect({
  variations,
  selectedIds,
  onChange,
  onCreateNew,
  label = "Nome da variação",
}: VariationNameMultiSelectProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedVariations = useMemo(
    () =>
      selectedIds
        .map((selectedId) => variations.find((item) => item.id === selectedId))
        .filter((item): item is Variation => Boolean(item)),
    [selectedIds, variations],
  );

  const filteredVariations = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return variations;
    return variations.filter((variation) =>
      `${variation.name} ${variation.id}`.toLowerCase().includes(normalized),
    );
  }, [query, variations]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (event.target instanceof Node && !root.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleVariation(variationId: string) {
    if (selectedIds.includes(variationId)) {
      onChange(selectedIds.filter((itemId) => itemId !== variationId));
      return;
    }
    onChange([...selectedIds, variationId]);
  }

  function removeVariation(variationId: string) {
    onChange(selectedIds.filter((itemId) => itemId !== variationId));
  }

  function handleCreate() {
    setOpen(false);
    onCreateNew();
  }

  const triggerLabel =
    selectedVariations.length === 0
      ? "Selecione as variações"
      : selectedVariations.length === 1
        ? selectedVariations[0]?.name
        : `${selectedVariations.length} variações selecionadas`;

  return (
    <Box ref={rootRef}>
      <Typography
        component="label"
        htmlFor={id}
        variant="body2"
        sx={{
          fontWeight: 500,
          display: "block",
          mb: 0.5
        }}>
        {label}
      </Typography>
      <Box sx={{ position: "relative" }}>
        <Button
          id={id}
          type="button"
          variant="outlined"
          role="combobox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          endIcon={<ExpandMore sx={{ fontSize: 16 }} />}
          sx={{
            width: "100%",
            justifyContent: "space-between",
            px: 1.5,
            py: 1,
            fontWeight: 400,
            color: selectedVariations.length === 0 ? "text.secondary" : "text.primary",
            textTransform: "none",
          }}
        >
          <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {triggerLabel}
          </Box>
        </Button>

        {open ? (
          <Box
            sx={{
              position: "absolute",
              top: "calc(100% + 0.25rem)",
              left: 0,
              zIndex: 50,
              display: "flex",
              width: "100%",
              flexDirection: "column",
              overflow: "hidden",
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              boxShadow: 3,
            }}
          >
            <Box sx={{ p: 1, borderBottom: 1, borderColor: "divider" }}>
              <SearchInput
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar variação…"
                fullWidth
              />
            </Box>
            <List dense sx={{ maxHeight: 224, overflow: "auto", py: 0.5 }}>
              {filteredVariations.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    px: 2,
                    py: 1.5
                  }}>
                  Nenhuma variação encontrada.
                </Typography>
              ) : (
                filteredVariations.map((variation) => {
                  const isSelected = selectedIds.includes(variation.id);
                  return (
                    <ListItemButton
                      key={variation.id}
                      onClick={() => toggleVariation(variation.id)}
                      sx={{ py: 0.75 }}
                    >
                      <ListItemText primary={variation.name} />
                      {isSelected ? <Check sx={{ fontSize: 16 }} /> : null}
                    </ListItemButton>
                  );
                })
              )}
            </List>
            <Box sx={{ borderTop: 1, borderColor: "divider", p: 0.5 }}>
              <Button
                type="button"
                variant="text"
                fullWidth
                onClick={handleCreate}
                startIcon={<Add sx={{ fontSize: 16 }} />}
                sx={{ justifyContent: "flex-start", fontWeight: 400 }}
              >
                Criar nova variação
              </Button>
            </Box>
          </Box>
        ) : null}
      </Box>
      {selectedVariations.length > 0 ? (
        <Stack
          direction="row"
          sx={{
            flexWrap: "wrap",
            gap: 0.5,
            mt: 0.75,
          }}>
          {selectedVariations.map((variation) => (
            <Chip
              key={variation.id}
              label={variation.name}
              size="small"
              onDelete={() => removeVariation(variation.id)}
              sx={{ fontWeight: 400 }}
            />
          ))}
        </Stack>
      ) : null}
    </Box>
  );
}
