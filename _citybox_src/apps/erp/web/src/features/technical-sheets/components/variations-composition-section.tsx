"use client";

import Tune from "@mui/icons-material/Tune";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { VariationCompositionBlock } from "@/features/technical-sheets/components/variation-composition-block";
import { formCompositionSectionGridSx, formSectionBoxSx, formSectionHeaderSx } from "@/features/technical-sheets/lib/technical-sheet-form-styles";
import type { CompositionComponentOption } from "@/features/technical-sheets/types/composition-component-option";
import type { VariationComposition } from "@/features/technical-sheets/types/technical-sheet";

type VariationsCompositionSectionProps = {
  variations: VariationComposition[];
  componentOptions: CompositionComponentOption[];
  onChange: (next: VariationComposition[]) => void;
};

export function VariationsCompositionSection({
  variations,
  componentOptions,
  onChange,
}: VariationsCompositionSectionProps) {
  function updateVariation(next: VariationComposition) {
    onChange(variations.map((variation) => variation.id === next.id ? next : variation));
  }

  return (
    <Box component="section" sx={formCompositionSectionGridSx}>
      <Box component="header" sx={formSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{
          fontWeight: 600
        }}>
          Composição das variações
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Configure a composição de insumos específicos para cada variação e opção de atributo (sabores, tamanhos, etc.) deste produto.
        </Typography>
      </Box>
      <Box sx={formSectionBoxSx}>
        {variations.length > 0 ? (
          <Stack spacing={2.5}>
            {variations.map((variation) => (
              <VariationCompositionBlock
                key={variation.id}
                variation={variation}
                componentOptions={componentOptions}
                onChange={updateVariation}
              />
            ))}
          </Stack>
        ) : (
          <Stack
            spacing={2}
            sx={{
              alignItems: "center",
              py: 6,
              textAlign: "center"
            }}>
            <Tune sx={{ fontSize: 32, color: "text.secondary" }} />
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: "text.primary"
                }}>
                Nenhuma variação cadastrada
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  mt: 0.5
                }}>
                Cadastre variações no produto principal para configurar a composição por sabor ou grade.
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>
    </Box>
  );
}

