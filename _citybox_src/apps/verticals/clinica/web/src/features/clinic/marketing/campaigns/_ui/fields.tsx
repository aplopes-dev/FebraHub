"use client";

import type { ComponentProps, ReactNode } from "react";

import { cn } from "@citybox/ui";
import {
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";
import { DatePicker, MultiSelect } from "@citybox/ui/molecules";

/**
 * Campos de formulário do Financeiro compostos com o @citybox/ui.
 *
 * Substituem os `@/components/atoms/fields/*` do OdontoTech mantendo a mesma
 * API (label / value / onChange / error) para reduzir a reescrita das telas.
 * SEMPRE renderizam o Label fixo acima do controle, como agenda/vendas/estoque.
 */

// -------------------------------- TextField -------------------------------- //

interface TextFieldProps
  extends Omit<ComponentProps<"input">, "onChange"> {
  label?: string;
  error?: boolean;
  icon?: ReactNode;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function TextField({
  label,
  error,
  icon,
  className,
  ...props
}: TextFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className={cn(error && "text-destructive")}>{label}</Label>
      )}
      {icon ? (
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted-foreground/80">
            {icon}
          </span>
          <Input
            aria-invalid={error}
            className={cn("ps-9", error && "border-destructive", className)}
            {...props}
          />
        </div>
      ) : (
        <Input
          aria-invalid={error}
          className={cn(error && "border-destructive", className)}
          {...props}
        />
      )}
    </div>
  );
}

// ------------------------------- NumberField ------------------------------- //

interface NumberFieldProps
  extends Omit<ComponentProps<"input">, "onChange" | "type"> {
  label?: string;
  error?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
}

export function NumberField({
  label,
  error,
  className,
  ...props
}: NumberFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className={cn(error && "text-destructive")}>{label}</Label>
      )}
      <Input
        type="number"
        aria-invalid={error}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
    </div>
  );
}

// ------------------------------ TextareaField ------------------------------ //

interface TextareaFieldProps
  extends Omit<ComponentProps<"textarea">, "onChange"> {
  label?: string;
  error?: boolean;
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

export function TextareaField({
  label,
  error,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className={cn(error && "text-destructive")}>{label}</Label>
      )}
      <Textarea
        aria-invalid={error}
        className={cn(error && "border-destructive", className)}
        {...props}
      />
    </div>
  );
}

// ------------------------------- SelectField ------------------------------- //

export interface SelectFieldOption {
  value: string;
  label: string;
  color?: string;
}

/** Alias de compatibilidade com o OdontoTech (`SelectOption`). */
export type SelectOption = SelectFieldOption;

interface SelectFieldProps {
  label?: string;
  options: SelectFieldOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
}

export function SelectField({
  label,
  options,
  value,
  onValueChange,
  placeholder = "Selecione",
  error,
  disabled,
  className,
}: SelectFieldProps) {
  const selected = options.find((option) => option.value === value);
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className={cn(error && "text-destructive")}>{label}</Label>
      )}
      <Select value={value ?? ""} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          aria-invalid={error}
          className={cn("w-full", error && "border-destructive", className)}
        >
          <SelectValue placeholder={placeholder}>
            {selected && (
              <span className="flex items-center gap-2">
                {selected.color && (
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: selected.color }}
                  />
                )}
                {selected.label}
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                {option.color && (
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                )}
                {option.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ----------------------------- DatePickerField ----------------------------- //

interface DatePickerFieldProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  /** Aceito por compatibilidade com o OdontoTech — ignorado. */
  dateFormat?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  className,
}: DatePickerFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className={cn(error && "text-destructive")}>{label}</Label>
      )}
      <DatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && "border-destructive", className)}
      />
    </div>
  );
}

// -------------------------- MultipleSelectorField -------------------------- //

interface MultipleSelectorFieldProps {
  label?: string;
  options: { value: string; label: string }[];
  value: string[];
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  error?: boolean;
  className?: string;
}

export function MultipleSelectorField({
  label,
  options,
  value,
  onValueChange,
  placeholder,
  error,
  className,
}: MultipleSelectorFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <Label className={cn(error && "text-destructive")}>{label}</Label>
      )}
      <MultiSelect
        options={options}
        value={value}
        onChange={onValueChange}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
}
