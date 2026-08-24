"use client";

import { cn } from "@citybox/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@citybox/ui/atoms";

import type { KanbanColumn } from "../../types";

interface StatusSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  columns: KanbanColumn[];
  disabled?: boolean;
}

export function StatusSelect({
  value,
  onValueChange,
  columns,
  disabled = false,
}: StatusSelectProps) {
  const sortedColumns = [...columns].sort((a, b) => a.order - b.order);
  const selectedColumn = columns.find((col) => col.id === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger
        className={cn(
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "border-none font-medium shadow-sm",
          "h-11 w-56 rounded-md",
          "[&_svg]:text-primary-foreground",
        )}
      >
        <SelectValue placeholder="Selecione o status">
          {selectedColumn?.name}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {sortedColumns.map((column) => (
          <SelectItem key={column.id} value={column.id}>
            {column.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
