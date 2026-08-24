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
} from "@citybox/ui/atoms";
import { Label, Input } from "@citybox/ui/atoms";

interface NewFunnelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFunnel: (name: string) => void;
  mode?: "create" | "edit";
  funnelId?: string;
  initialName?: string;
  onUpdateFunnel?: (id: string, name: string) => void;
}

export function NewFunnelModal({
  open,
  onOpenChange,
  onCreateFunnel,
  mode = "create",
  funnelId,
  initialName = "",
  onUpdateFunnel,
}: NewFunnelModalProps) {
  const [funnelName, setFunnelName] = useState(initialName);

  useEffect(() => {
    if (open) setFunnelName(initialName);
  }, [open, initialName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (funnelName.trim()) {
      if (mode === "edit" && funnelId && onUpdateFunnel) {
        onUpdateFunnel(funnelId, funnelName.trim());
      } else {
        onCreateFunnel(funnelName.trim());
      }
      setFunnelName("");
      onOpenChange(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setFunnelName("");
    onOpenChange(newOpen);
  };

  const isEdit = mode === "edit";
  const title = isEdit ? "Editar Funil" : "Novo Funil";
  const description = isEdit
    ? "Altere o nome do funil."
    : "Crie um novo funil para organizar suas oportunidades.";
  const submitLabel = isEdit ? "Salvar" : "Criar funil";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <div className="flex flex-col gap-1.5">
              <Label>Nome do funil</Label>
              <Input
                value={funnelName}
                onChange={(e) => setFunnelName(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="px-8" disabled={!funnelName.trim()}>
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
