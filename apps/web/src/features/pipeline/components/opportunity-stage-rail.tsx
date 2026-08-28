"use client";

import CheckIcon from "@mui/icons-material/Check";
import { Box, Stack, Tooltip, Typography } from "@/ui";
import type { Stage } from "@/lib/mock-db";

/**
 * A régua de etapas: onde a oportunidade está e para onde pode ir.
 *
 * Clicar move — é o mesmo gesto do arraste no quadro, disponível para quem
 * chegou aqui pela lista ou pela busca. Etapas de fecho (ganha/perdida) não
 * entram na régua: elas têm botão próprio, com a confirmação que cada uma pede.
 */
export function OpportunityStageRail({
  stages,
  currentStageId,
  onSelect,
  disabled,
}: {
  stages: Stage[];
  currentStageId: string;
  onSelect: (stageId: string) => void;
  disabled?: boolean;
}) {
  const openStages = stages.filter((stage) => stage.kind === "aberta");
  const currentIndex = openStages.findIndex((stage) => stage.id === currentStageId);

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
      {openStages.map((stage, index) => {
        const isCurrent = stage.id === currentStageId;
        const isPast = currentIndex >= 0 && index < currentIndex;

        return (
          <Tooltip key={stage.id} title={`${stage.probability}% de chance`} arrow>
            <Box
              component="button"
              type="button"
              disabled={disabled}
              onClick={() => onSelect(stage.id)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                border: 1,
                cursor: disabled ? "default" : "pointer",
                borderColor: isCurrent ? "primary.main" : "divider",
                bgcolor: isCurrent
                  ? "primary.main"
                  : isPast
                    ? "action.hover"
                    : "transparent",
                color: isCurrent ? "primary.contrastText" : "text.secondary",
                font: "inherit",
                "&:hover": disabled ? undefined : { borderColor: "primary.main" },
              }}
            >
              {isPast ? <CheckIcon sx={{ fontSize: 13 }} /> : null}
              <Typography variant="caption" sx={{ fontWeight: isCurrent ? 700 : 500 }}>
                {stage.name}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
