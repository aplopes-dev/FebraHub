"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "../../atoms/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../atoms/popover";
import { Calendar } from "../../atoms/calendar";
import { cn } from "../../../lib/utils";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  popoverClassName?: string;
  disabled?: boolean;
  /** Nome acessível do botão gatilho (ex.: "Data inicial"). */
  "aria-label"?: string;
  /**
   * Portal do popover (ex.: dentro de um Drawer Vaul, que fecha em
   * interações fora do seu conteúdo). Mesmo padrão do `DateRangePickerInput`.
   */
  portalContainer?: HTMLElement | null;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecionar data",
  className,
  popoverClassName,
  disabled,
  "aria-label": ariaLabel,
  portalContainer,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  function handleSelect(date: Date | undefined) {
    onChange?.(date);
    if (date) setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          disabled={disabled}
          aria-label={ariaLabel}
          className={cn(
            "h-9 w-full justify-start gap-2 rounded-3xl bg-input/50 px-3 text-left text-sm font-normal hover:bg-input/50 aria-expanded:bg-input/50 dark:hover:bg-input/50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 shrink-0" />
          {value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        container={portalContainer}
        className={cn("w-auto p-0", popoverClassName)}
      >
        <Calendar
          {...({
            mode: "single",
            selected: value,
            onSelect: handleSelect,
            locale: ptBR,
            initialFocus: true,
          } as object)}
        />
      </PopoverContent>
    </Popover>
  );
}
