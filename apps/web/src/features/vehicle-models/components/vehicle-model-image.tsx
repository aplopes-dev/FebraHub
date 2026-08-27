"use client";

import { useState } from "react";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import Box from "@mui/material/Box";

const PLACEHOLDER_SRC = "/images/vehicle-model-placeholder.svg";

type VehicleModelImageProps = {
  imageUrl: string | null;
  alt: string;
  /** `card` — grade; `thumb` — miniatura na listagem (40×40). */
  variant?: "card" | "thumb";
};

export function VehicleModelImage({
  imageUrl,
  alt,
  variant = "card",
}: VehicleModelImageProps) {
  const [failed, setFailed] = useState(false);
  const showRemote = Boolean(imageUrl) && !failed;
  const isThumb = variant === "thumb";

  return (
    <Box
      sx={{
        position: "relative",
        width: isThumb ? 40 : "100%",
        height: isThumb ? 40 : 140,
        flexShrink: isThumb ? 0 : undefined,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "action.hover",
        borderRadius: 1,
        overflow: "hidden",
        ...(isThumb
          ? {
              border: 1,
              borderColor: "divider",
            }
          : null),
      }}
    >
      {showRemote && imageUrl ? (
        <Box
          component="img"
          src={imageUrl}
          alt={alt}
          onError={() => setFailed(true)}
          sx={{
            maxWidth: "100%",
            maxHeight: "100%",
            width: isThumb ? "100%" : undefined,
            height: isThumb ? "100%" : undefined,
            objectFit: isThumb ? "cover" : "contain",
            display: "block",
          }}
        />
      ) : (
        <>
          <Box
            component="img"
            src={PLACEHOLDER_SRC}
            alt=""
            aria-hidden
            sx={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.85,
            }}
          />
          <DirectionsCarOutlinedIcon
            sx={{
              position: "absolute",
              fontSize: isThumb ? 16 : 48,
              color: "text.disabled",
              opacity: 0.35,
            }}
          />
        </>
      )}
    </Box>
  );
}
