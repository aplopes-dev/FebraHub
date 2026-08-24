"use client";

import { Box, PageHeader, Skeleton, Stack } from "@citybox/mui";

export function FiscalParametersDetailSkeleton() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        gap: 3,
        p: 3,
      }}
    >
      <PageHeader sx={{ flexShrink: 0, mb: 0 }} title="Parâmetros fiscais" />
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={40} width="40%" />
        <Skeleton variant="rounded" height={180} />
        <Skeleton variant="rounded" height={280} />
      </Stack>
    </Box>
  );
}
