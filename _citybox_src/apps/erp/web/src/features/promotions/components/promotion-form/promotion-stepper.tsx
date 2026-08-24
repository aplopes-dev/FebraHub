"use client";

import CheckIcon from "@mui/icons-material/Check";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import {
  PROMOTION_STEP_LABELS,
  PROMOTION_STEP_ORDER,
} from "@/features/promotions/types/promotion-form";

type PromotionStepperProps = {
  currentIndex: number;
  onStepClick: (index: number) => void;
};

export function PromotionStepper({
  currentIndex,
  onStepClick,
}: PromotionStepperProps) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: "background.paper",
        px: 3,
        py: 2,
      }}
    >
      <Stack
        component="ol"
        direction="row"
        spacing={{ xs: 2, sm: 4 }}
        useFlexGap
        sx={{
          listStyle: "none",
          m: 0,
          p: 0,
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {PROMOTION_STEP_ORDER.map((step, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isClickable = index <= currentIndex;

          return (
            <Box
              component="li"
              key={step}
              sx={{ display: "flex", alignItems: "center", gap: 2 }}
            >
              <ButtonBase
                type="button"
                disabled={!isClickable}
                onClick={() => onStepClick(index)}
                aria-current={isCurrent ? "step" : undefined}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  borderRadius: 999,
                  py: 0.5,
                  pr: 1.5,
                  pl: 0.5,
                  cursor: isClickable ? "pointer" : "default",
                  bgcolor: isCurrent
                    ? (theme) => alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                  color: isCurrent ? "text.primary" : "text.secondary",
                  "&:hover": {
                    color: isClickable ? "text.primary" : undefined,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    bgcolor:
                      isDone || isCurrent ? "primary.main" : "action.selected",
                    color:
                      isDone || isCurrent
                        ? "primary.contrastText"
                        : "text.secondary",
                  }}
                >
                  {isDone ? (
                    <CheckIcon sx={{ fontSize: 14 }} aria-hidden />
                  ) : (
                    index + 1
                  )}
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {PROMOTION_STEP_LABELS[step]}
                </Typography>
              </ButtonBase>

              {index < PROMOTION_STEP_ORDER.length - 1 ? (
                <Box
                  aria-hidden
                  sx={{
                    display: { xs: "none", sm: "block" },
                    width: 64,
                    height: 1,
                    bgcolor: "divider",
                  }}
                />
              ) : null}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
