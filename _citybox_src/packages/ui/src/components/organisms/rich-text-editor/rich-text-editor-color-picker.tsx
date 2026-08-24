"use client";

import type { Editor } from "@tiptap/react";
import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "../../../lib/utils";
import { Button } from "../../atoms/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../atoms/popover";

const TEXT_COLORS = [
  { id: "default", label: "Padrão", value: null, swatch: "#111827" },
  { id: "gray", label: "Cinza", value: "#6b7280", swatch: "#6b7280" },
  { id: "brown", label: "Marrom", value: "#92400e", swatch: "#92400e" },
  { id: "orange", label: "Laranja", value: "#ea580c", swatch: "#ea580c" },
  { id: "yellow", label: "Amarelo", value: "#ca8a04", swatch: "#ca8a04" },
  { id: "green", label: "Verde", value: "#16a34a", swatch: "#16a34a" },
  { id: "blue", label: "Azul", value: "#2563eb", swatch: "#2563eb" },
  { id: "purple", label: "Roxo", value: "#7c3aed", swatch: "#7c3aed" },
  { id: "pink", label: "Rosa", value: "#db2777", swatch: "#db2777" },
  { id: "red", label: "Vermelho", value: "#dc2626", swatch: "#dc2626" },
] as const;

const HIGHLIGHT_COLORS = [
  { id: "none", label: "Sem destaque", value: null, swatch: "transparent" },
  { id: "yellow", label: "Amarelo", value: "#fef08a", swatch: "#fef08a" },
  { id: "green", label: "Verde", value: "#bbf7d0", swatch: "#bbf7d0" },
  { id: "blue", label: "Azul", value: "#bfdbfe", swatch: "#bfdbfe" },
  { id: "purple", label: "Roxo", value: "#e9d5ff", swatch: "#e9d5ff" },
  { id: "pink", label: "Rosa", value: "#fbcfe8", swatch: "#fbcfe8" },
  { id: "gray", label: "Cinza", value: "#e5e7eb", swatch: "#e5e7eb" },
] as const;

const COLOR_PICKER_SELECTOR = "[data-rte-color-picker='true']";

function resolveTextColorId(editor: Editor | null): string {
  if (!editor) return "default";
  const color = editor.getAttributes("textStyle").color as string | undefined;
  if (!color) return "default";
  return TEXT_COLORS.find((option) => option.value?.toLowerCase() === color.toLowerCase())?.id ?? "default";
}

function resolveHighlightId(editor: Editor | null): string {
  if (!editor) return "none";
  if (!editor.isActive("highlight")) return "none";
  const color = editor.getAttributes("highlight").color as string | undefined;
  if (!color) return "yellow";
  return (
    HIGHLIGHT_COLORS.find((option) => option.value?.toLowerCase() === color.toLowerCase())?.id ?? "yellow"
  );
}

function resolveWheelDelta(event: WheelEvent, element: HTMLElement): number {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * element.clientHeight;
  }
  return event.deltaY;
}

type ColorOptionRowProps = {
  label: string;
  swatch: string;
  mode: "text" | "highlight";
  selected: boolean;
  onSelect: () => void;
};

function ColorOptionRow({ label, swatch, mode, selected, onSelect }: ColorOptionRowProps) {
  return (
    <button
      type="button"
      onMouseDown={(event) => event.preventDefault()}
      onClick={onSelect}
      className={cn(
        "flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted/70",
        selected && "bg-muted/80 ring-1 ring-inset ring-border/70",
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded text-base font-semibold leading-none",
          mode === "highlight" && swatch === "transparent" && "bg-background ring-1 ring-border/60",
          mode === "highlight" && swatch !== "transparent" && "ring-1 ring-border/40",
        )}
        style={
          mode === "highlight"
            ? { backgroundColor: swatch === "transparent" ? undefined : swatch, color: "#111827" }
            : { color: swatch }
        }
        aria-hidden
      >
        A
      </span>
      <span className="truncate text-sm text-foreground">{label}</span>
    </button>
  );
}

type TextColorAndHighlightPickerProps = {
  editor: Editor | null;
  disabled?: boolean;
};

export function TextColorAndHighlightPicker({
  editor,
  disabled,
}: TextColorAndHighlightPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedTextColorId, setSelectedTextColorId] = useState("default");
  const [selectedHighlightId, setSelectedHighlightId] = useState("none");

  useEffect(() => {
    if (!open) return;
    setSelectedTextColorId(resolveTextColorId(editor));
    setSelectedHighlightId(resolveHighlightId(editor));
  }, [editor, open]);

  useEffect(() => {
    if (!open) return;

    const handleWheel = (event: WheelEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const popover = target.closest(COLOR_PICKER_SELECTOR);
      if (!(popover instanceof HTMLElement)) return;

      if (popover.scrollHeight <= popover.clientHeight) return;

      event.preventDefault();
      event.stopPropagation();
      popover.scrollTop += resolveWheelDelta(event, popover);
    };

    window.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => window.removeEventListener("wheel", handleWheel, { capture: true });
  }, [open]);

  const applyTextColor = (value: string | null, id: string) => {
    if (!editor) return;
    if (value === null) {
      editor.chain().focus().unsetColor().run();
    } else {
      editor.chain().focus().setColor(value).run();
    }
    setSelectedTextColorId(id);
  };

  const applyHighlight = (value: string | null, id: string) => {
    if (!editor) return;
    if (value === null) {
      editor.chain().focus().unsetHighlight().run();
    } else {
      editor.chain().focus().setHighlight({ color: value }).run();
    }
    setSelectedHighlightId(id);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || !editor}
          className="h-8 gap-0.5 px-2 text-xs font-normal"
          aria-label="Cor do texto e destaque"
          title="Cor do Texto e Destaque"
        >
          <span className="text-base font-semibold leading-none">A</span>
          <ChevronDown className="size-3.5 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        data-rte-color-picker="true"
        className="z-[300] block max-h-72 w-56 overflow-y-auto overscroll-y-contain rounded-xl p-1.5 shadow-md"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
      >
        <p className="px-2 py-1 text-xs font-medium text-muted-foreground">Cor</p>
        <div className="flex flex-col">
          {TEXT_COLORS.map((option) => (
            <ColorOptionRow
              key={`text-${option.id}`}
              label={option.label}
              swatch={option.swatch}
              mode="text"
              selected={selectedTextColorId === option.id}
              onSelect={() => applyTextColor(option.value, option.id)}
            />
          ))}
        </div>

        <p className="mt-1 px-2 py-1 text-xs font-medium text-muted-foreground">Destaque</p>
        <div className="flex flex-col">
          {HIGHLIGHT_COLORS.map((option) => (
            <ColorOptionRow
              key={`highlight-${option.id}`}
              label={option.label}
              swatch={option.swatch}
              mode="highlight"
              selected={selectedHighlightId === option.id}
              onSelect={() => applyHighlight(option.value, option.id)}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
