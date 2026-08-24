"use client";

import * as React from "react";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "../../atoms/popover";
import { Calendar } from "../../atoms/calendar";
import { cn } from "../../../lib/utils";

export type { DateRange };

export interface DateRangePickerInputProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  numberOfMonths?: number;
  /** Popover modal — use dentro de Drawer Vaul. */
  modal?: boolean;
  /** Portal para host interno (ex.: DrawerContent). */
  portalContainer?: HTMLElement | null;
}

function isCompleteRange(range: DateRange | undefined): boolean {
  return Boolean(range?.from && range?.to);
}

function formatRangeLabel(range: DateRange | undefined): string {
  if (range?.from && range?.to) {
    return `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – ${format(range.to, "dd/MM/yyyy", { locale: ptBR })}`;
  }
  if (range?.from) {
    return `${format(range.from, "dd/MM/yyyy", { locale: ptBR })} – ...`;
  }
  return "";
}

export function DateRangePickerInput({
  value,
  onChange,
  placeholder = "Selecionar período",
  className,
  disabled,
  numberOfMonths = 2,
  modal = false,
  portalContainer,
}: DateRangePickerInputProps) {
  const [open, setOpen] = React.useState(false);
  /** Seleção em andamento no calendário (reabre vazia se o período já estava completo). */
  const [draft, setDraft] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    if (!open) {
      setDraft(value);
    }
  }, [value, open]);

  const label = formatRangeLabel(value);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Ao entrar de novo com início+fim já escolhidos, reinicia a escolha.
      setDraft(isCompleteRange(value) ? undefined : value);
      return;
    }
    setDraft(value);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    setDraft(undefined);
    onChange?.(undefined);
  }

  function handleSelect(range: DateRange | undefined) {
    setDraft(range);

    const complete =
      range?.from &&
      range?.to &&
      range.from.toDateString() !== range.to.toDateString();

    if (complete) {
      onChange?.(range);
      setOpen(false);
      return;
    }

    // Intervalo parcial: atualiza o valor só se ainda não havia período completo
    // (evita limpar o filtro aplicado enquanto o usuário escolhe o novo fim).
    if (!isCompleteRange(value)) {
      onChange?.(range);
    }
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal={modal}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            // Mesmo padrão do SelectTrigger
            "flex h-9 w-fit items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow,background-color] outline-none",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !label && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 truncate text-left">{label || placeholder}</span>
          {label ? (
            <span
              role="button"
              aria-label="Limpar período"
              onClick={handleClear}
              className="ml-1 rounded-sm text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </span>
          ) : (
            <span className="size-4" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        container={portalContainer}
        className="w-auto p-0"
      >
        <Calendar
          {...({
            mode: "range",
            selected: draft,
            onSelect: handleSelect,
            resetOnSelect: true,
            locale: ptBR,
            numberOfMonths,
            initialFocus: true,
          } as object)}
        />
      </PopoverContent>
    </Popover>
  );
}
