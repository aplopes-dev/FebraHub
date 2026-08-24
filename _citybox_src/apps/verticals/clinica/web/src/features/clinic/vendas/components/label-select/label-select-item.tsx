"use client";

import { useState } from "react";
import { Pencil, CheckIcon } from "lucide-react";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";

import type { Label } from "../../services/sales.service";

interface LabelSelectItemProps {
  label: Label;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (e: React.MouseEvent) => void;
}

export function LabelSelectItem({
  label,
  isSelected,
  onSelect,
  onEdit,
}: LabelSelectItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "group relative my-0.5 flex w-full cursor-pointer items-center gap-2 rounded px-3 py-1.5",
        isSelected && "bg-accent",
      )}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: label.color }}
      />

      <span className="flex-1 truncate text-sm">{label.name}</span>

      {isSelected && <CheckIcon className="ml-auto shrink-0" size={16} />}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className={cn(
          "ml-1 h-6 w-6 shrink-0 p-0 transition-opacity hover:bg-accent",
          isHovered ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(e);
        }}
        title="Editar rótulo"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
