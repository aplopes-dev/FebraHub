"use client";

import { Box, Skeleton, Stack } from "@citybox/mui";
import { formSplitLayoutGridSx } from "@/components/ui/form";

const sectionSx = {
  p: 2,
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  bgcolor: "background.paper",
} as const;

/** Estrutura do formulário de pedido/venda enquanto o detalhe carrega. */
export function SaleOrderFormSkeleton() {
  return (
    <Box
      component="section"
      aria-busy
      aria-label="Carregando dados da venda"
      sx={{
        display: "flex",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        flexDirection: "column",
        overflow: "hidden",
        m: -3,
        width: "calc(100% + 48px)",
      }}
    >
      <Stack spacing={3} sx={{ overflow: "auto", px: 3, pt: 3, pb: 2 }}>
        <Stack spacing={0.5}>
          <Skeleton variant="text" width={90} height={20} />
          <Skeleton variant="text" width={280} height={38} />
        </Stack>

        <Box sx={formSplitLayoutGridSx}>
          <Stack spacing={3}>
            <Box sx={sectionSx}>
              <Stack spacing={1.5}>
                <Skeleton variant="text" width={120} height={26} />
                <Skeleton variant="rounded" width="100%" height={44} />
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton
                    key={index}
                    variant="rounded"
                    width="100%"
                    height={56}
                  />
                ))}
              </Stack>
            </Box>
            <Box sx={sectionSx}>
              <Stack spacing={1.5}>
                <Skeleton variant="text" width={150} height={26} />
                <Skeleton variant="rounded" width="100%" height={72} />
              </Stack>
            </Box>
          </Stack>

          <Stack spacing={3}>
            {Array.from({ length: 3 }, (_, index) => (
              <Box key={index} sx={sectionSx}>
                <Stack spacing={1.5}>
                  <Skeleton variant="text" width={120} height={26} />
                  <Skeleton variant="rounded" width="100%" height={44} />
                  <Skeleton variant="rounded" width="100%" height={44} />
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
