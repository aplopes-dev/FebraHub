"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import {
  Button,
  Group,
  Input,
  Label,
  NumberField,
  type NumberFieldProps,
} from "react-aria-components";

import { cn } from "../../../lib/utils";

export interface NumberInputProps
  extends Omit<NumberFieldProps, "className" | "children" | "onChange"> {
  /** Rótulo opcional acima do campo. */
  label?: string;
  /** Texto auxiliar abaixo do campo. */
  description?: string;
  /** Classes no `Group` (container com borda). */
  className?: string;
  /** Classes no input numérico. */
  inputClassName?: string;
  /** Callback controlado — espelha o padrão de `CurrencyInput`. */
  onValueChange?: (value: number) => void;
}

/**
 * Number input com botões − / + (React Aria `NumberField`).
 * Baseado no padrão Origin UI / coss.com (comp-28).
 */
export function NumberInput({
  label,
  description,
  className,
  inputClassName,
  onValueChange,
  ...props
}: NumberInputProps) {
  return (
    <NumberField
      {...props}
      onChange={(value) => {
        onValueChange?.(Number.isFinite(value) ? value : 0);
      }}
    >
      <div className={cn((label || description) && "*:not-first:mt-2")}>
        {label ? (
          <Label className="text-sm font-medium text-foreground">{label}</Label>
        ) : null}
        <Group
          data-slot="number-input"
          className={cn(
            "relative inline-flex h-9 w-full items-center overflow-hidden whitespace-nowrap rounded-3xl border border-transparent bg-input/50 text-sm outline-none transition-[color,box-shadow]",
            "data-focus-within:border-ring data-focus-within:ring-3 data-focus-within:ring-ring/30",
            "data-disabled:opacity-50",
            "data-focus-within:has-aria-invalid:border-destructive data-focus-within:has-aria-invalid:ring-destructive/20",
            "dark:data-focus-within:has-aria-invalid:ring-destructive/40",
            className,
          )}
        >
          <Button
            slot="decrement"
            className={cn(
              "-ms-px flex aspect-square h-[inherit] items-center justify-center rounded-s-3xl border border-transparent bg-transparent text-muted-foreground/80 text-sm transition-[color,box-shadow]",
              "hover:bg-accent hover:text-foreground",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <MinusIcon aria-hidden size={16} />
          </Button>
          <Input
            className={cn(
              "w-full grow bg-transparent px-2 py-2 text-center text-foreground tabular-nums outline-none",
              inputClassName,
            )}
          />
          <Button
            slot="increment"
            className={cn(
              "-me-px flex aspect-square h-[inherit] items-center justify-center rounded-e-3xl border border-transparent bg-transparent text-muted-foreground/80 text-sm transition-[color,box-shadow]",
              "hover:bg-accent hover:text-foreground",
              "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            <PlusIcon aria-hidden size={16} />
          </Button>
        </Group>
        {description ? (
          <p
            aria-live="polite"
            className="text-xs text-muted-foreground"
            role="region"
          >
            {description}
          </p>
        ) : null}
      </div>
    </NumberField>
  );
}
