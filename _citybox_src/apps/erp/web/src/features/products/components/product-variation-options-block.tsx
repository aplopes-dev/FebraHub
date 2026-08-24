"use client";

import Add from "@mui/icons-material/Add";
import Check from "@mui/icons-material/Check";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Sort from "@mui/icons-material/Sort";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, SearchInput } from "@citybox/mui";
import type { VariationOption } from "@/features/variations/types/variation";

type ProductVariationOptionsBlockProps = {
  variationName: string;
  options: VariationOption[];
  selectedOptionIds: string[];
  onChange: (optionIds: string[]) => void;
  onCreateOption: () => void;
};

export function ProductVariationOptionsBlock({
  variationName,
  options = [],
  selectedOptionIds = [],
  onChange,
  onCreateOption,
}: ProductVariationOptionsBlockProps) {
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const catalogOptions = Array.isArray(options) ? options : [];

  const sortedCatalog = useMemo(
    () =>
      [...catalogOptions].sort((a, b) => a.sortOrder - b.sortOrder),
    [catalogOptions],
  );

  const selectedOptions = useMemo(
    () =>
      selectedOptionIds
        .map((optionId) =>
          catalogOptions.find((option) => option.id === optionId),
        )
        .filter((option): option is VariationOption => Boolean(option)),
    [catalogOptions, selectedOptionIds],
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return sortedCatalog;
    return sortedCatalog.filter((option) =>
      `${option.name || "Sem nome"} ${option.id}`.toLowerCase().includes(normalized),
    );
  }, [query, sortedCatalog]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  function toggleOption(optionId: string) {
    if (selectedOptionIds.includes(optionId)) {
      onChange(selectedOptionIds.filter((itemId) => itemId !== optionId));
      return;
    }
    onChange([...selectedOptionIds, optionId]);
  }

  function addAllOptions() {
    onChange(sortedCatalog.map((option) => option.id));
  }

  function removeOption(optionId: string) {
    onChange(selectedOptionIds.filter((itemId) => itemId !== optionId));
  }

  function handleCreate() {
    setOpen(false);
    onCreateOption();
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = selectedOptionIds.findIndex((itemId) => itemId === active.id);
    const newIndex = selectedOptionIds.findIndex((itemId) => itemId === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(selectedOptionIds, oldIndex, newIndex));
  }

  const triggerLabel =
    selectedOptions.length === 0
      ? "Selecione as opções"
      : selectedOptions.length === 1
        ? selectedOptions[0]?.name || "Sem nome"
        : `${selectedOptions.length} opções selecionadas`;

  return (
    <Stack spacing={1}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 32,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          Opções da variação &quot;{variationName}&quot;
        </Typography>
        <Button
          type="button"
          variant="text"
          size="small"
          onClick={addAllOptions}
          disabled={sortedCatalog.length === 0}
          sx={{ minWidth: 0, px: 0.5 }}
        >
          Adicionar todas as opções
        </Button>
      </Stack>
      <Box ref={rootRef} sx={{ position: "relative" }}>
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
            color: selectedOptions.length === 0 ? "text.secondary" : "text.primary",
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
                placeholder="Buscar opção…"
                fullWidth
              />
            </Box>
            <List dense sx={{ maxHeight: 224, overflow: "auto", py: 0.5 }}>
              {filteredOptions.length === 0 ? (
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    px: 2,
                    py: 1.5
                  }}>
                  Nenhuma opção encontrada.
                </Typography>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selectedOptionIds.includes(option.id);
                  const optionLabel = option.name || "Sem nome";
                  return (
                    <ListItemButton
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      sx={{ py: 0.75 }}
                    >
                      <ListItemText primary={optionLabel} />
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
                Adicionar opção
              </Button>
            </Box>
          </Box>
        ) : null}
      </Box>
      {selectedOptions.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={selectedOptionIds}
            strategy={verticalListSortingStrategy}
          >
            <Stack component="ul" spacing={0.5} sx={{ p: 0, m: 0, listStyle: "none" }}>
              {selectedOptions.map((option) => (
                <SelectedOptionRow
                  key={option.id}
                  option={option}
                  onRemove={() => removeOption(option.id)}
                />
              ))}
            </Stack>
          </SortableContext>
        </DndContext>
      ) : null}
    </Stack>
  );
}

function SelectedOptionRow({
  option,
  onRemove,
}: {
  option: VariationOption;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box
      component="li"
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: "action.hover",
        px: 1,
        py: 0.5,
        zIndex: isDragging ? 10 : "auto",
        opacity: isDragging ? 0.8 : 1,
      }}
    >
      <Button
        type="button"
        variant="text"
        aria-label={`Reordenar ${option.name || "opção"}`}
        sx={{ minWidth: 0, p: 0.5, cursor: "grab" }}
        {...attributes}
        {...listeners}
      >
        <Sort sx={{ fontSize: 16 }} />
      </Button>
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {option.name || "Sem nome"}
      </Typography>
      <Button
        type="button"
        variant="text"
        aria-label={`Remover ${option.name || "opção"}`}
        onClick={onRemove}
        sx={{ minWidth: 0, p: 0.5 }}
      >
        <DeleteOutlined sx={{ fontSize: 16 }} />
      </Button>
    </Box>
  );
}
