import type { ComponentProps } from "react";
import type { FieldError as RHFFieldError } from "react-hook-form";

import { cn } from "@citybox/ui";

/**
 * Módulo mínimo vendorizado no lugar de `@/components/ui/field` do OdontoTech
 * (que não existe no @citybox/ui). Reproduz Field / FieldGroup / FieldError.
 */

export function Field({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}

export function FieldGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4", className)} {...props} />;
}

interface FieldErrorProps {
  errors?: Array<RHFFieldError | undefined>;
}

export function FieldError({ errors }: FieldErrorProps) {
  const message = errors?.find((error) => error?.message)?.message;
  if (!message) return null;
  return <p className="text-sm text-destructive">{message}</p>;
}
