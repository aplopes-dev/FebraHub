"use client";

import { Box, Typography } from "@/ui";
import {
  BackButton,
} from "@/components/ui/form/back-button";

export type EntityFormHeaderProps = {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel?: string;
};

/**
 * Header de formulário/detalhe com {@link BackButton} padronizado.
 */
export function EntityFormHeader({
  title,
  subtitle,
  backHref,
  backLabel = "",
}: EntityFormHeaderProps) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 3,
      }}
    >
      <BackButton
        href={backHref}
        label={backLabel}
        aria-label={backLabel || "Voltar"}
      />
      <Box>
        {subtitle ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {subtitle}
          </Typography>
        ) : null}
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {title}
        </Typography>
      </Box>
    </Box>
  );
}
