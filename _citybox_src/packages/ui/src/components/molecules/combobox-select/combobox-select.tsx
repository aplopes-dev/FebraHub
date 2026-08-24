"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
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

export type ComboboxSelectOption = {
  value: string;
  /** Texto principal (exibido no trigger e na lista). */
  label: string;
  /** Texto secundário abaixo do label (tom mais suave). */
  description?: string;
  /** Termos extras para a busca (não exibidos). */
  keywords?: string[];
};

export type ComboboxSelectProps = {
  options: ComboboxSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  /** Rótulo do botão de criar no rodapé da lista. */
  createLabel?: string;
  /** Callback ao clicar em criar (fecha o popover antes). */
  onCreate?: () => void;
  /**
   * Popover modal (recomendado dentro de Drawer Vaul).
   * Evita disputa de foco com o trap do drawer.
   */
  modal?: boolean;
  /**
   * Portal do conteúdo para um host interno (ex.: `DrawerContent`).
   * Necessário dentro de Drawer Vaul — o body fica com `pointer-events: none`.
   */
  portalContainer?: HTMLElement | null;
};

function optionSearchValue(option: ComboboxSelectOption): string {
  return [option.label, option.description, ...(option.keywords ?? [])]
    .filter(Boolean)
    .join(" ");
}

export function ComboboxSelect({
  options,
  value,
  onValueChange,
  placeholder = "Selecionar…",
  searchPlaceholder = "Buscar…",
  emptyText = "Nenhum resultado encontrado.",
  className,
  disabled,
  id,
  createLabel,
  onCreate,
  modal = false,
  portalContainer,
}: ComboboxSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabel = React.useMemo(
    () => options.find((option) => option.value === value)?.label,
    [options, value],
  );

  const showCreate = Boolean(createLabel && onCreate);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          id={id}
          variant="outline"
          role="combobox"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "h-9 w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]",
            className,
          )}
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>
            {selectedLabel ?? placeholder}
          </span>
          <ChevronDownIcon
            aria-hidden
            className="size-4 shrink-0 text-muted-foreground/80"
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        container={portalContainer}
        className="w-[var(--radix-popover-trigger-width)] min-w-[var(--radix-popper-anchor-width)] border-input p-0"
      >
        <Command className="overflow-hidden rounded-[inherit]">
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-64">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = value === option.value;
                const hasDescription = Boolean(option.description?.trim());
                return (
                  <CommandItem
                    key={option.value}
                    value={optionSearchValue(option)}
                    onSelect={() => {
                      onValueChange(isSelected ? "" : option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "items-start gap-3 py-2.5",
                      !hasDescription && "items-center",
                    )}
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="truncate font-medium text-foreground">
                        {option.label}
                      </div>
                      {hasDescription ? (
                        <div className="truncate text-xs font-normal text-muted-foreground">
                          {option.description}
                        </div>
                      ) : null}
                    </div>
                    <CheckIcon
                      aria-hidden
                      className={cn(
                        "mt-0.5 size-4 shrink-0 text-foreground",
                        !hasDescription && "mt-0",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
          {showCreate ? (
            <div className="shrink-0 border-t border-border/60 p-1.5">
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-start font-normal"
                onClick={() => {
                  setOpen(false);
                  onCreate?.();
                }}
              >
                <PlusIcon aria-hidden className="-ms-2 size-4 opacity-60" />
                {createLabel}
              </Button>
            </div>
          ) : null}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
