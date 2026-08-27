"use client";

import Link from "next/link";
import OpenInNewOutlinedIcon from "@mui/icons-material/OpenInNewOutlined";
import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button } from "@/ui";
import { UnitAvatar } from "@/features/branches/components/unit-avatar";
import type { Branch } from "@/features/branches/types/branch";

type ParentMatrixBannerProps = {
  matrix: Branch | null;
  isLoading?: boolean;
  isError?: boolean;
};

export function ParentMatrixBanner({
  matrix,
  isLoading = false,
  isError = false,
}: ParentMatrixBannerProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
          bgcolor: "action.hover",
          px: 2,
          py: 1.5,
        }}
      >
        <Skeleton variant="text" width={120} height={20} />
        <Skeleton variant="text" width="60%" height={28} sx={{ mt: 1 }} />
      </Box>
    );
  }

  if (isError || !matrix) {
    return (
      <Box
        sx={{
          border: 1,
          borderColor: "warning.main",
          borderRadius: 1,
          bgcolor: "action.hover",
          px: 2,
          py: 1.5,
        }}
      >
        <Typography variant="body2" color="warning.main">
          Não foi possível carregar a empresa matriz desta filial.
        </Typography>
      </Box>
    );
  }

  const detailLine = [
    matrix.code,
    matrix.tradeName || matrix.legalName,
    matrix.document || "—",
  ].join(" · ");

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "action.hover",
        px: 2,
        py: 1.5,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" } }}
      >
        <Stack direction="row" spacing={1.5} sx={{ flex: 1, minWidth: 0, alignItems: "center" }}>
          <UnitAvatar unit={matrix} size={44} />
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}
            >
              Empresa matriz
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
              {matrix.displayName}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {detailLine}
            </Typography>
          </Stack>
        </Stack>
        <Button
          component={Link}
          href={`/settings/units/matrices/${matrix.id}`}
          size="small"
          variant="outlined"
          endIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />}
          sx={{ alignSelf: { xs: "flex-start", sm: "center" }, flexShrink: 0 }}
        >
          Ver matriz
        </Button>
      </Stack>
    </Box>
  );
}
