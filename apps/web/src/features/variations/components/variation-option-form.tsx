"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CurrencyInput, FormField } from "@/ui";
import { VariationOptionImageBox } from "@/features/variations/components/variation-option-image-box";
import { createEmptyVariationOption } from "@/features/variations/api/variations.service";
import type { VariationOption } from "@/features/variations/types/variation";

type VariationOptionFormProps = {
  formId: string;
  initialValues?: VariationOption;
  onSubmit: (option: VariationOption) => void;
};

export function VariationOptionForm({
  formId,
  initialValues,
  onSubmit,
}: VariationOptionFormProps) {
  const [option, setOption] = useState<VariationOption>(
    () => initialValues ?? createEmptyVariationOption(0),
  );

  function patch(partial: Partial<VariationOption>) {
    setOption((prev) => ({ ...prev, ...partial }));
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

  return (
    <Box
      component="form"
      id={formId}
      sx={{ display: "flex", flexDirection: "column", gap: 2 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          ...option,
          name: option.name.trim(),
          description: option.description.trim(),
          code: option.code.trim(),
        });
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          p: 1.5,
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <VariationOptionImageBox
          previewUrl={option.imageUrl}
          onChange={changeImage}
        />
        <Stack spacing={1.25} sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600,
              letterSpacing: "0.04em",
              textTransform: "uppercase"
            }}>
            Nova opção
          </Typography>
          <FormField
            id={`${formId}-name`}
            label="Nome"
            value={option.name}
            onChange={(event) => patch({ name: event.target.value })}
            placeholder="Ex.: P, M, G…"
            required
            autoFocus
          />
          <FormField
            id={`${formId}-description`}
            label="Descrição"
            value={option.description}
            onChange={(event) => patch({ description: event.target.value })}
            placeholder="Opcional"
          />
        </Stack>
      </Box>
      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        <CurrencyInput
          id={`${formId}-price`}
          label="Preço"
          value={option.price}
          onValueChange={(price) => patch({ price })}
        />
        <FormField
          id={`${formId}-code`}
          label="Código"
          value={option.code}
          onChange={(event) => patch({ code: event.target.value })}
          placeholder="SKU / código"
        />
      </Box>
    </Box>
  );
}
