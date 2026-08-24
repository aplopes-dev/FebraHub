"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Sort from "@mui/icons-material/Sort";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, CurrencyInput, FormField } from "@citybox/mui";
import { VariationOptionImageBox } from "@/features/variations/components/variation-option-image-box";
import type { VariationOption } from "@/features/variations/types/variation";

type VariationOptionSortableRowProps = {
  option: VariationOption;
  index: number;
  onChange: (next: VariationOption) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function VariationOptionSortableRow({
  option,
  index,
  onChange,
  onRemove,
  canRemove,
}: VariationOptionSortableRowProps) {
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

  function patch(partial: Partial<VariationOption>) {
    onChange({ ...option, ...partial });
  }

  function changeImage(
    image: { previewUrl: string; file: File } | null,
  ) {
    if (option.imageUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(option.imageUrl);
    }
    patch({
      imageUrl: image?.previewUrl ?? null,
      pendingImageFile: image?.file ?? null,
    });
  }

  const optionLabel = option.name.trim() || `Opção ${index + 1}`;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{ zIndex: isDragging ? 10 : "auto" }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 1.5,
          borderRadius: 1,
          border: 1,
          borderColor: isDragging ? "primary.main" : "divider",
          bgcolor: isDragging ? "action.hover" : "background.paper",
          boxShadow: isDragging ? 2 : 0,
          opacity: isDragging ? 0.95 : 1,
          transition: (theme) =>
            theme.transitions.create(
              ["border-color", "box-shadow", "background-color"],
              { duration: theme.transitions.duration.shorter },
            ),
        }}
      >
        <Button
          type="button"
          variant="text"
          aria-label={`Reordenar ${optionLabel}`}
          sx={{
            minWidth: 0,
            alignSelf: "flex-start",
            p: 0.5,
            mt: 0.25,
            flexShrink: 0,
            cursor: "grab",
            color: "text.secondary",
            "&:active": { cursor: "grabbing" },
          }}
          {...attributes}
          {...listeners}
        >
          <Sort sx={{ fontSize: 16 }} />
        </Button>

        <VariationOptionImageBox
          previewUrl={option.imageUrl}
          onChange={changeImage}
        />

        <Stack spacing={1.25} sx={{ minWidth: 0, flex: 1 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase"
              }}>
              Opção {index + 1}
            </Typography>
            <Button
              type="button"
              variant="text"
              disabled={!canRemove}
              aria-label={`Remover ${optionLabel}`}
              onClick={onRemove}
              sx={{
                minWidth: 0,
                p: 0.5,
                mt: -0.5,
                mr: -0.5,
                color: "text.secondary",
                "&:hover": { color: "error.main" },
              }}
            >
              <DeleteOutlined sx={{ fontSize: 16 }} />
            </Button>
          </Box>

          <FormField
            id={`option-name-${option.id}`}
            label="Nome"
            value={option.name}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Ex.: P, M, G…"
            required
          />

          <FormField
            id={`option-description-${option.id}`}
            label="Descrição"
            value={option.description}
            onChange={(event) => patch({ description: event.target.value })}
            placeholder="Opcional"
          />

          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
            }}
          >
            <CurrencyInput
              id={`option-price-${option.id}`}
              label="Preço"
              value={option.price}
              onValueChange={(price) => patch({ price })}
            />
            <FormField
              id={`option-code-${option.id}`}
              label="Código"
              value={option.code}
              onChange={(event) => patch({ code: event.target.value })}
              placeholder="SKU"
            />
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
