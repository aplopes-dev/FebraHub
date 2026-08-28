"use client";

import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Box } from "@/ui";

/**
 * O `Text Input` do design NodeX (Figma, nó `37253:28058`): rótulo **acima** do
 * campo, e não o label flutuante do MUI que o `FormField` usa.
 */

/** Altura do campo no desenho — o padrão do tema é 44px. */
const FIELD_HEIGHT = 48;
/** Respiro entre o rótulo e o campo. */
const LABEL_GAP = "6px";

/**
 * Medidas do campo no desenho, para aplicar no `Input`/`PasswordInput` que
 * entra como filho. Só ajusta o que difere do tema; cor de traço, raio e
 * estados continuam vindo de lá.
 */
export const authInputSx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root": {
    height: FIELD_HEIGHT,
    minHeight: FIELD_HEIGHT,
    // O adornment do olho encosta a 12px da borda, como no desenho.
    pr: "12px",
  },
  "& .MuiOutlinedInput-input": {
    padding: "8px 12px",
    fontSize: "1rem",
    lineHeight: "24px",
  },
};

export type AuthFieldProps = {
  label: ReactNode;
  /** `id` do controle que o rótulo aponta. */
  htmlFor: string;
  children: ReactNode;
};

export function AuthField({ label, htmlFor, children }: AuthFieldProps) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: LABEL_GAP,
      }}
    >
      <Box
        component="label"
        htmlFor={htmlFor}
        sx={{ fontSize: "1rem", lineHeight: "24px", fontWeight: 500 }}
      >
        {label}
      </Box>
      {children}
    </Box>
  );
}
