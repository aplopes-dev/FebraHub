"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";

import { cn } from "@citybox/ui";
import { Button, Input } from "@citybox/ui/atoms";

/**
 * Reimplementação enxuta do `@/components/ui/key-value` do OdontoTech.
 *
 * O componente original é um compound complexo (radix + store interno). Aqui a
 * feature de Marketing usa apenas um editor de pares "label / tag" para as
 * opções de perguntas radio/checkbox, então esta versão renderiza as linhas
 * diretamente a partir de `value`/`onValueChange`. Os subcomponentes de
 * template (`KeyValueList`, `KeyValueItem`, ...) são mantidos como no-ops para
 * preservar a mesma árvore JSX de uso.
 */

export interface KeyValueItemData {
  id: string;
  key: string;
  value: string;
}

interface KeyValueProps {
  value: KeyValueItemData[];
  onValueChange: (items: KeyValueItemData[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  minItems?: number;
  trim?: boolean;
  children?: React.ReactNode;
}

let keyValueCounter = 0;
function nextItemId(): string {
  keyValueCounter += 1;
  return `kv-${keyValueCounter}`;
}

export function KeyValue({
  value,
  onValueChange,
  keyPlaceholder = "Chave",
  valuePlaceholder = "Valor",
  minItems = 0,
}: KeyValueProps) {
  const items = value.length > 0 ? value : [];

  const update = (id: string, field: "key" | "value", next: string) => {
    onValueChange(
      items.map((item) =>
        item.id === id ? { ...item, [field]: next } : item,
      ),
    );
  };

  const remove = (id: string) => {
    if (items.length <= minItems) return;
    onValueChange(items.filter((item) => item.id !== id));
  };

  const add = () => {
    onValueChange([...items, { id: nextItemId(), key: "", value: "" }]);
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.id} className="flex min-w-0 items-center gap-2">
          <Input
            className="min-w-0 flex-1"
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(event) => update(item.id, "key", event.target.value)}
          />
          <Input
            className="min-w-0 flex-1"
            placeholder={valuePlaceholder}
            value={item.value}
            onChange={(event) => update(item.id, "value", event.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => remove(item.id)}
            disabled={items.length <= minItems}
          >
            <X className="size-4" />
            <span className="sr-only">Remover</span>
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={add}
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar opção
      </Button>
    </div>
  );
}

// Subcomponentes de template — no-ops (a `KeyValue` já renderiza as linhas).
export function KeyValueList({ className }: { className?: string; children?: React.ReactNode }) {
  return <span className={cn("hidden", className)} aria-hidden />;
}
export function KeyValueItem(_: {
  className?: string;
  children?: React.ReactNode;
}) {
  return null;
}
export function KeyValueKeyInput(_: { className?: string }) {
  return null;
}
export function KeyValueValueInput(_: { className?: string; maxRows?: number }) {
  return null;
}
export function KeyValueRemove(_: { className?: string }) {
  return null;
}
export function KeyValueAdd(_: {
  className?: string;
  children?: React.ReactNode;
}) {
  return null;
}
