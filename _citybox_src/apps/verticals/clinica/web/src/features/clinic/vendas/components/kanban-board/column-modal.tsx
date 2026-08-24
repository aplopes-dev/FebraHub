"use client";

import { useState, useEffect } from "react";

import { Button } from "@citybox/ui/atoms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@citybox/ui/atoms";
import { CategoryColorField } from "@/features/clinic/components/category-color-field";
import { normalizeCategoryHex } from "@/features/clinic/lib/normalize-category-hex";

const DEFAULT_STAGE_COLOR = "#94a3b8";

function resolveStageColor(color: string | undefined): string {
  if (!color?.trim()) return DEFAULT_STAGE_COLOR;
  return normalizeCategoryHex(color);
}

interface ColumnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color?: string) => void;
  mode: "create" | "edit";
  initialName?: string;
  initialColor?: string;
}

export function ColumnModal({
  open,
  onOpenChange,
  onSubmit,
  mode,
  initialName = "",
  initialColor,
}: ColumnModalProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(() => resolveStageColor(initialColor));

  useEffect(() => {
    if (open) {
      setName(initialName);
      setColor(resolveStageColor(initialColor));
    }
  }, [open, initialName, initialColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim(), normalizeCategoryHex(color));
      setName("");
      setColor(DEFAULT_STAGE_COLOR);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName("");
      setColor(DEFAULT_STAGE_COLOR);
    }
    onOpenChange(newOpen);
  };

  const isCreate = mode === "create";
  const title = isCreate ? "Nova Etapa" : "Editar Etapa";
  const description = isCreate
    ? "Adicione uma nova etapa ao seu funil."
    : "Altere o nome e a cor da etapa.";
  const submitLabel = isCreate ? "Criar etapa" : "Salvar";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div className="flex flex-col gap-1.5">
              <Label>Nome da etapa</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <CategoryColorField
              id="vendas-stage-color"
              value={color}
              onChange={setColor}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="px-8" disabled={!name.trim()}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
