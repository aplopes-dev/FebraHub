"use client";

import { Box, Skeleton, Stack } from "@/ui";
import {
  formCompositionSectionGridSx,
  formSectionBorderRadius,
  formSectionBoxSx,
  formSectionGridSx,
} from "@/features/technical-sheets/lib/technical-sheet-form-styles";

/** Skeleton da ficha técnica enquanto detail/produto/variações/insumos carregam. */
export function TechnicalSheetDetailSkeleton() {
  return (
    <Box
      component="section"
      aria-busy
      aria-label="Carregando ficha técnica"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          gap: 3,
          px: 3,
          pt: 3,
          pb: 4,
          overflow: "auto",
        }}
      >
        <Stack spacing={1}>
          <Skeleton variant="text" width={100} height={20} />
          <Skeleton variant="text" width={260} height={36} />
          <Skeleton variant="text" width={120} height={18} />
        </Stack>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ maxWidth: 560 }}
        >
          <Skeleton
            variant="rounded"
            height={88}
            sx={{ borderRadius: formSectionBorderRadius, flex: 1 }}
          />
          <Skeleton
            variant="rounded"
            height={88}
            sx={{ borderRadius: formSectionBorderRadius, flex: 1 }}
          />
        </Stack>

        <Skeleton
          variant="rounded"
          height={40}
          width={220}
          sx={{ borderRadius: formSectionBorderRadius }}
        />

        <Box sx={formCompositionSectionGridSx}>
          <Stack spacing={1}>
            <Skeleton variant="text" width="70%" height={24} />
            <Skeleton variant="text" width="95%" height={18} />
            <Skeleton variant="text" width="80%" height={18} />
          </Stack>
          <Box sx={formSectionBoxSx}>
            <Stack spacing={1.5}>
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton
                  key={index}
                  variant="rounded"
                  height={56}
                  sx={{ borderRadius: formSectionBorderRadius, width: "100%" }}
                />
              ))}
              <Skeleton
                variant="rounded"
                height={40}
                width={180}
                sx={{ borderRadius: formSectionBorderRadius }}
              />
            </Stack>
          </Box>
        </Box>

        <Box sx={formSectionGridSx}>
          <Stack spacing={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="90%" height={18} />
          </Stack>
          <Box sx={formSectionBoxSx}>
            <Stack spacing={1.5}>
              <Skeleton
                variant="rounded"
                height={48}
                sx={{ borderRadius: formSectionBorderRadius, width: "100%" }}
              />
              <Skeleton
                variant="rounded"
                height={48}
                sx={{ borderRadius: formSectionBorderRadius, width: "100%" }}
              />
              <Skeleton
                variant="rounded"
                height={72}
                sx={{ borderRadius: formSectionBorderRadius, width: "55%" }}
              />
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1.5,
          px: 3,
          py: 2,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Skeleton
          variant="rounded"
          width={100}
          height={40}
          sx={{ borderRadius: formSectionBorderRadius }}
        />
        <Skeleton
          variant="rounded"
          width={120}
          height={40}
          sx={{ borderRadius: formSectionBorderRadius }}
        />
      </Box>
    </Box>
  );
}
