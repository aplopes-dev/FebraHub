"use client";

import { Plus } from "lucide-react";

import { cn } from "@citybox/ui";

interface AddColumnButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddColumnButton({ onClick, className }: AddColumnButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-full w-72 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/25 p-4 text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-muted/50",
        className,
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="text-sm font-medium">Criar nova Etapa</span>
    </button>
  );
}
