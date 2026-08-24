"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import { Skeleton } from "@citybox/mui";

const COLUMN_COUNT = 4;
const CARDS_PER_COLUMN = 3;

function ProductionKanbanCardSkeleton() {
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={1.25}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="70%" height={20} />
            <Skeleton variant="text" width="40%" height={16} />
          </Box>
          <Skeleton variant="rounded" width={36} height={20} />
        </Stack>
        <Skeleton variant="rounded" width="100%" height={14} />
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width="55%" height={16} />
        </Stack>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Skeleton variant="circular" width={16} height={16} />
          <Skeleton variant="text" width="45%" height={16} />
        </Stack>
      </Stack>
    </Paper>
  );
}

function ProductionKanbanColumnSkeleton() {
  return (
    <Paper
      variant="outlined"
      sx={{
        width: "22.5rem",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        p: 1.5,
        bgcolor: "action.hover",
        borderRadius: 2,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 0.5 }}>
        <Skeleton variant="circular" width={8} height={8} />
        <Skeleton variant="text" width={96} height={20} />
        <Skeleton
          variant="rounded"
          width={28}
          height={20}
          sx={{ ml: "auto" }}
        />
      </Stack>
      <Stack spacing={1.25}>
        {Array.from({ length: CARDS_PER_COLUMN }, (_, index) => (
          <ProductionKanbanCardSkeleton key={index} />
        ))}
      </Stack>
    </Paper>
  );
}

/** Placeholder do board enquanto a query do Kanban carrega. */
export function ProductionKanbanSkeleton() {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 2,
        flex: 1,
        minHeight: 0,
        overflowX: "auto",
        pb: 1,
      }}
      aria-busy
      aria-label="Carregando pedidos de produção"
    >
      {Array.from({ length: COLUMN_COUNT }, (_, index) => (
        <ProductionKanbanColumnSkeleton key={index} />
      ))}
    </Box>
  );
}
