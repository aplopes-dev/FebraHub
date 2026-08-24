"use client";

import { Alert } from "@citybox/mui";

type CompanySoonAlertProps = {
  children: string;
};

/** Aviso de aba/campos ainda não persistidos pela API. */
export function CompanySoonAlert({ children }: CompanySoonAlertProps) {
  return (
    <Alert severity="info" sx={{ mb: 1 }}>
      {children}
    </Alert>
  );
}
