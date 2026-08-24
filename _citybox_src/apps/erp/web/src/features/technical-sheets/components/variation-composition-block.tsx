"use client";

import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Collapse from "@mui/material/Collapse";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { ComponentListEditor } from "@/features/technical-sheets/components/component-list-editor";
import type { CompositionComponentOption } from "@/features/technical-sheets/types/composition-component-option";
import type { CompositionComponentRow, VariationComposition, VariationOptionComposition } from "@/features/technical-sheets/types/technical-sheet";

type VariationCompositionBlockProps = {
  variation: VariationComposition;
  componentOptions: CompositionComponentOption[];
  onChange: (next: VariationComposition) => void;
};

export function VariationCompositionBlock({
  variation,
  componentOptions,
  onChange,
}: VariationCompositionBlockProps) {
  const [expandedVariation, setExpandedVariation] = useState(variation.id);
  const [expandedOptions, setExpandedOptions] = useState<string[]>(variation.options.map((o) => o.id));

  function updateOption(optionId: string, components: CompositionComponentRow[]) {
    const nextOptions: VariationOptionComposition[] = variation.options.map(
      (option) => option.id === optionId ? { ...option, components } : option,
    );
    onChange({ ...variation, options: nextOptions });
  }

  function toggleOption(optionId: string) {
    setExpandedOptions((prev) => prev.includes(optionId) ? prev.filter((id) => id !== optionId) : [...prev, optionId]);
  }

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
      }}
    >
      <ButtonBase
        onClick={() => setExpandedVariation(expandedVariation === variation.id ? "" : variation.id)}
        sx={{
          width: "100%",
          justifyContent: "flex-start",
          px: 2,
          py: 1.5,
          textAlign: "left",
          transition: "background-color 0.2s",
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            flex: 1
          }}>
          {variation.variationName}
        </Typography>
        {expandedVariation === variation.id ? (
          <ExpandLess sx={{ fontSize: 18, color: "text.secondary" }} />
        ) : (
          <ExpandMore sx={{ fontSize: 18, color: "text.secondary" }} />
        )}
      </ButtonBase>
      <Collapse in={expandedVariation === variation.id}>
        <Box sx={{ px: 2, pb: 2 }}>
          {variation.options.map((option) => (
            <Box
              key={option.id}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
                mt: 1,
              }}
            >
              <ButtonBase
                onClick={() => toggleOption(option.id)}
                sx={{
                  width: "100%",
                  justifyContent: "flex-start",
                  px: 2,
                  py: 1,
                  textAlign: "left",
                  transition: "background-color 0.2s",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >

                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" sx={{
                    fontWeight: 500
                  }}>{option.optionName}</Typography>
                  {option.optionDescription ? (
                    <Typography variant="caption" sx={{
                      color: "text.secondary"
                    }}>{option.optionDescription}</Typography>
                  ) : null}
                </Box>
                {expandedOptions.includes(option.id) ? (
                  <ExpandLess sx={{ fontSize: 16, color: "text.secondary" }} />
                ) : (
                  <ExpandMore sx={{ fontSize: 16, color: "text.secondary" }} />
                )}
              </ButtonBase>

              <Collapse in={expandedOptions.includes(option.id)}>
                <Box sx={{ px: 2, pb: 2 }}>
                  <ComponentListEditor
                    components={option.components}
                    componentOptions={componentOptions}
                    onChange={(components) => updateOption(option.id, components)}
                    addLabel="Adicionar insumo"
                    emptyLabel="Nenhum insumo vinculado a esta variação."
                  />
                </Box>
              </Collapse>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}
