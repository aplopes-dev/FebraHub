"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";

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

const DEFAULT_LABEL_COLOR = "#94a3b8";

function resolveLabelColor(color: string | undefined): string {
  if (!color?.trim()) return DEFAULT_LABEL_COLOR;
  return normalizeCategoryHex(color);
}

interface LabelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, color: string) => void;
  onDelete?: () => void;
  mode: "create" | "edit";
  labelId?: string;
  initialName?: string;
  initialColor?: string;
  isLoading?: boolean;
}

export function LabelModal({
  open,
  onOpenChange,
  onSubmit,
  onDelete,
  mode,
  initialName = "",
  initialColor = DEFAULT_LABEL_COLOR,
  isLoading = false,
}: LabelModalProps) {
  const [name, setName] = useState(initialName);
  const [color, setColor] = useState(() => resolveLabelColor(initialColor));

  useEffect(() => {
    if (open) {
      setName(initialName);
      setColor(resolveLabelColor(initialColor));
    }
  }, [open, initialName, initialColor]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!name.trim()) return;
    onSubmit(name.trim(), normalizeCategoryHex(color));
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setName(initialName);
      setColor(resolveLabelColor(initialColor));
    }
    onOpenChange(newOpen);
  };

  const isEdit = mode === "edit";
  const title = isEdit ? "Editar Rótulo" : "Novo Rótulo";
  const description = isEdit
    ? "Altere o nome e a cor do rótulo."
    : "Crie um novo rótulo para categorizar oportunidades.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-1.5">
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <span className="ml-1 block text-xs text-muted-foreground/70">
              Ex: Urgente, VIP, Normal...
            </span>
          </div>

          <CategoryColorField
            id="vendas-label-color"
            value={color}
            onChange={setColor}
          />

          <DialogFooter>
            <div className="flex w-full items-center justify-between">
              <div>
                {isEdit && onDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Excluir rótulo"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  className="px-8"
                  type="submit"
                  disabled={!name.trim() || isLoading}
                  onClick={(e) => e.stopPropagation()}
                >
                  {isLoading
                    ? isEdit
                      ? "Salvando..."
                      : "Criando..."
                    : isEdit
                      ? "Salvar"
                      : "Criar rótulo"}
                </Button>
              </div>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
