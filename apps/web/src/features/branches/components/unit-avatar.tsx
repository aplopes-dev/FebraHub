"use client";

import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import Box from "@mui/material/Box";
import { unitLogoProxyUrl } from "@/features/branches/api/unit-logo-url";
import type { Branch } from "@/features/branches/types/branch";

type UnitAvatarProps = {
  unit: Pick<Branch, "id" | "kind" | "hasLogo" | "updatedAt" | "displayName">;
  size?: number;
};

export function UnitAvatar({ unit, size = 40 }: UnitAvatarProps) {
  const iconSize = Math.round(size * 0.45);

  if (unit.hasLogo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={unitLogoProxyUrl(unit.kind, unit.id, unit.updatedAt)}
        alt=""
        width={size}
        height={size}
        style={{
          borderRadius: 8,
          objectFit: "contain",
          flexShrink: 0,
          background: "var(--mui-palette-action-hover)",
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: 1,
        bgcolor: "action.hover",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {unit.kind === "matrix" ? (
        <BusinessOutlinedIcon sx={{ fontSize: iconSize, color: "text.secondary" }} />
      ) : (
        <StorefrontOutlinedIcon sx={{ fontSize: iconSize, color: "text.secondary" }} />
      )}
    </Box>
  );
}
