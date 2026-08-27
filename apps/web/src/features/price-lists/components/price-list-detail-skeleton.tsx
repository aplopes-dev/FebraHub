"use client";

import { Box, Skeleton, Stack } from "@/ui";
import { surfaceBorderRadius } from "@/theme/surface-styles";

/** Skeleton da página de detalhe enquanto metadados/itens carregam. */
export function PriceListDetailSkeleton() {
  return (
    <Box
      component="section"
      aria-busy
      aria-label="Carregando lista de preços"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        m: -3,
        width: "calc(100% + 48px)",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3, p: 3 }}>
        <Stack spacing={1}>
          <Skeleton variant="text" width={120} height={20} />
          <Skeleton variant="text" width={280} height={36} />
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              variant="rounded"
              height={88}
              sx={{ borderRadius: surfaceBorderRadius, width: "100%" }}
            />
          ))}
          <Skeleton
            variant="rounded"
            height={88}
            sx={{
              gridColumn: { sm: "1 / -1" },
              borderRadius: surfaceBorderRadius,
              width: "100%",
            }}
          />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: surfaceBorderRadius,
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{
              alignItems: { sm: "center" },
              justifyContent: "space-between",
            }}
          >
            <Stack spacing={0.5} sx={{ minWidth: 0, flex: 1 }}>
              <Skeleton variant="text" width={160} height={24} />
              <Skeleton variant="text" width="80%" height={20} />
            </Stack>
            <Skeleton
              variant="rounded"
              width={160}
              height={40}
              sx={{ borderRadius: surfaceBorderRadius, flexShrink: 0 }}
            />
          </Stack>

          <Stack spacing={1}>
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={56}
                sx={{ borderRadius: surfaceBorderRadius, width: "100%" }}
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
