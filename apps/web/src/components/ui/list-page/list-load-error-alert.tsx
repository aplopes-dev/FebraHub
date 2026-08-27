"use client";

import type { ReactNode } from "react";
import { Alert, AlertTitle, Button } from "@/ui";

export type ListLoadErrorAlertProps = {
  title: string;
  message?: ReactNode;
  onRetry: () => void;
};

export function ListLoadErrorAlert({
  title,
  message,
  onRetry,
}: ListLoadErrorAlertProps) {
  return (
    <Alert
      severity="error"
      action={
        <Button
          type="button"
          color="inherit"
          onClick={() => void onRetry()}
        >
          Tentar novamente
        </Button>
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}
