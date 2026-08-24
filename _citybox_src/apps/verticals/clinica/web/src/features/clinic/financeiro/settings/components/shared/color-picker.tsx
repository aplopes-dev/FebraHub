"use client";

import { Input, Label } from "@citybox/ui/atoms";

import { cn } from "@citybox/ui";


const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E",
  "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280",
  "#14B8A6", "#F59E0B", "#10B981", "#6366F1",
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-6 gap-2">
        {PRESET_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={cn(
              "size-8 rounded-full border-2 transition-all",
              value === color
                ? "border-foreground scale-110"
                : "border-transparent hover:scale-105"
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <div
          className="size-8 rounded-full border shrink-0"
          style={{ backgroundColor: value }}
        />
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1 block">Hex personalizado</Label>
          <Input
            value={value}
            onChange={(e) => {
              const v = e.target.value;
              if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange(v);
            }}
            placeholder="#000000"
            className="h-8 font-mono text-sm"
          />
        </div>
      </div>
    </div>
  );
}
