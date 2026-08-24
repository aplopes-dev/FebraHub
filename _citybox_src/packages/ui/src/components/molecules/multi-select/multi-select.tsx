"use client";

import * as React from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Badge } from "../../atoms/badge";
import { Button } from "../../atoms/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../atoms/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../atoms/popover";
import { cn } from "../../../lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  /** Máximo de badges exibidos antes de agrupar em "+N". */
  maxDisplay?: number;
  /** Rótulo do botão de confirmação no rodapé do popover. */
  actionLabel?: string;
  /** Callback ao confirmar a seleção (fecha o popover). */
  onAction?: () => void;
  actionDisabled?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Selecionar...",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado encontrado.",
  className,
  disabled,
  maxDisplay = 3,
  actionLabel,
  onAction,
  actionDisabled,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOptions = React.useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const toggle = (optionValue: string) => {
    const next = value.includes(optionValue)
      ? value.filter((item) => item !== optionValue)
      : [...value, optionValue];
    onChange(next);
  };

  const remove = (optionValue: string) => {
    onChange(value.filter((item) => item !== optionValue));
  };

  const visible = selectedOptions.slice(0, maxDisplay);
  const overflow = selectedOptions.length - visible.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "h-auto min-h-9 w-full justify-between gap-2 rounded-3xl border border-transparent bg-input/50 px-3 py-1.5 text-left text-base font-normal transition-[color,box-shadow,background-color] hover:bg-input/50 aria-expanded:bg-input/50 dark:bg-input/50 dark:hover:bg-input/50 md:text-sm",
            className,
          )}
        >
          <span className="flex flex-1 flex-wrap items-center gap-1.5">
            {selectedOptions.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {visible.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="gap-1"
                    asChild
                  >
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        remove(option.value);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          remove(option.value);
                        }
                      }}
                    >
                      {option.label}
                      <X className="size-3 opacity-60" />
                    </span>
                  </Badge>
                ))}
                {overflow > 0 ? (
                  <Badge variant="secondary">+{overflow}</Badge>
                ) : null}
              </>
            )}
          </span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value.includes(option.value);
                return (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    data-checked={isSelected}
                    onSelect={() => toggle(option.value)}
                  >
                    {option.label}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {actionLabel && onAction ? (
          <div className="border-t p-2">
            <Button
              type="button"
              className="w-full"
              size="sm"
              disabled={disabled || actionDisabled}
              onClick={() => {
                onAction();
                setOpen(false);
              }}
            >
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
