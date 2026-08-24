"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Alert, AlertTitle, RadioGroup } from "@citybox/mui";
import { PROMOTION_SECTION_GRID_SX } from "@/features/promotions/components/promotion-form/promotion-form-primitives";
import { formSectionHeaderSx } from "@/components/ui/form";
import { PROMOTION_TYPE_GROUPS } from "@/features/promotions/lib/promotion-type-catalog";
import { PromotionTypeCard } from "@/features/promotions/components/promotion-form/promotion-type-card";
import type { PromotionType } from "@/features/promotions/types/promotion";

type PromotionTypeStepProps = {
  value: PromotionType | null;
  onChange: (type: PromotionType) => void;
  /** Trava a seleção do tipo (modo edição). */
  typeLocked?: boolean;
};

export function PromotionTypeStep({
  value,
  onChange,
  typeLocked = false,
}: PromotionTypeStepProps) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
          Qual tipo de promoção você quer criar?
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Escolha a modalidade que melhor se encaixa na sua campanha. As regras
          específicas de cada tipo são configuradas na última etapa.
        </Typography>
      </Box>

      {typeLocked ? (
        <Alert severity="info" icon={<LockOutlinedIcon fontSize="inherit" />}>
          <AlertTitle>O tipo não pode ser alterado</AlertTitle>
          O tipo de promoção é definido na criação e não pode ser trocado ao
          editar. Para usar outra modalidade, crie uma nova promoção.
        </Alert>
      ) : null}

      <RadioGroup
        value={value ?? ""}
        onChange={(_, next) => onChange(next as PromotionType)}
      >
        <Stack spacing={4}>
          {PROMOTION_TYPE_GROUPS.map((group) => (
            <Box key={group.id} component="section" sx={PROMOTION_SECTION_GRID_SX}>
              <Box component="header" sx={formSectionHeaderSx}>
                <Typography
                  component="h3"
                  variant="subtitle1"
                  sx={{ fontWeight: 600 }}
                >
                  {group.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {group.description}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { sm: "1fr 1fr" },
                }}
              >
                {group.types.map((meta) => (
                  <PromotionTypeCard
                    key={meta.type}
                    meta={meta}
                    selected={value === meta.type}
                    disabled={typeLocked}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Stack>
      </RadioGroup>
    </Stack>
  );
}
