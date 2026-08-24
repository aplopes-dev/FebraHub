"use client";

import { useState, useId } from "react";
import { ChevronDown, Plus, Check, Pencil } from "lucide-react";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import { Popover, PopoverContent, PopoverTrigger } from "@citybox/ui/atoms";

import type { Funnel } from "../../types";
import { NewFunnelModal } from "./new-funnel-modal";

interface FunnelSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  funnels: Funnel[];
  onCreateFunnel: (name: string) => void;
  onUpdateFunnel?: (id: string, name: string) => void;
  /** Sem manage: só selecionar funil. */
  canManage?: boolean;
  className?: string;
  disabled?: boolean;
}

export function FunnelSelect({
  value,
  onValueChange,
  funnels,
  onCreateFunnel,
  onUpdateFunnel,
  canManage = true,
  className,
  disabled,
}: FunnelSelectProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [funnelToEdit, setFunnelToEdit] = useState<Funnel | null>(null);

  const selectedFunnel = funnels.find((f) => f.id === value);
  const hasValue = !!selectedFunnel;

  const handleSelect = (funnelId: string) => {
    onValueChange(funnelId);
    setOpen(false);
  };

  const handleEditFunnel = (funnel: Funnel, e: React.MouseEvent) => {
    e.stopPropagation();
    setFunnelToEdit(funnel);
    setModalMode("edit");
    setOpen(false);
    setIsModalOpen(true);
  };

  const handleUpdateFunnel = (funnelId: string, name: string) => {
    onUpdateFunnel?.(funnelId, name);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <div className={cn("group relative", className)}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={disabled}
              className={cn(
                "w-full justify-between font-normal hover:bg-transparent",
                !hasValue && "text-muted-foreground",
              )}
            >
              {selectedFunnel?.name ?? "Funil"}
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-60 overflow-hidden p-0" align="start">
          <div className="flex flex-col">
            {funnels.map((funnel) => (
              <div
                key={funnel.id}
                className={cn(
                  "group flex items-center justify-between hover:bg-accent",
                  value === funnel.id && "bg-accent",
                )}
              >
                <button
                  type="button"
                  onClick={() => handleSelect(funnel.id)}
                  className={cn(
                    "flex flex-1 items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                    value === funnel.id && "bg-accent",
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === funnel.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span>{funnel.name}</span>
                </button>
                {!funnel.isDefault && canManage && onUpdateFunnel && (
                  <button
                    type="button"
                    onClick={(e) => handleEditFunnel(funnel, e)}
                    className="h-full px-3 py-2 opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100"
                    title="Editar funil"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            ))}

            {canManage ? (
              <div className="border-t">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setModalMode("create");
                    setFunnelToEdit(null);
                    setIsModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-primary transition-colors hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Funil</span>
                </button>
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <NewFunnelModal
        open={isModalOpen}
        onOpenChange={(nextOpen) => {
          setIsModalOpen(nextOpen);
          if (!nextOpen) setFunnelToEdit(null);
        }}
        onCreateFunnel={onCreateFunnel}
        mode={modalMode}
        funnelId={funnelToEdit?.id}
        initialName={funnelToEdit?.name}
        onUpdateFunnel={onUpdateFunnel ? handleUpdateFunnel : undefined}
      />
    </>
  );
}
