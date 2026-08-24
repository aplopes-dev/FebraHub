"use client";

import { useState } from "react";
import { ChevronDownIcon, Plus } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@citybox/ui";
import { Button, Label as FieldLabel } from "@citybox/ui/atoms";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@citybox/ui/atoms";
import { Popover, PopoverContent, PopoverTrigger } from "@citybox/ui/atoms";
import { ConfirmDialog } from "@citybox/ui/organisms";

import { LabelSelectItem } from "./label-select-item";
import { LabelModal } from "./label-modal";
import { useLabels } from "../../hooks/use-labels";
import { useCreateLabel } from "../../hooks/use-create-label";
import { useUpdateLabel } from "../../hooks/use-update-label";
import { useDeleteLabel } from "../../hooks/use-delete-label";
import type { Label } from "../../services/sales.service";

interface LabelSelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  error?: boolean;
}

export function LabelSelect({
  label = "Rótulo",
  placeholder = "Selecione um rótulo",
  value,
  onValueChange,
  disabled,
  className,
  id,
  error,
}: LabelSelectProps) {
  const [open, setOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [labelToEdit, setLabelToEdit] = useState<Label | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const { data: labels = [], isLoading } = useLabels();
  const createLabel = useCreateLabel();
  const updateLabel = useUpdateLabel();
  const deleteLabelMutation = useDeleteLabel();

  const hasValue = value !== undefined && value !== "";
  const selectedLabel = labels.find((l) => l.id === value);

  const handleSelect = (labelId: string) => {
    const newValue = labelId === value ? undefined : labelId;
    onValueChange?.(newValue);
    setOpen(false);
  };

  const handleCreateNew = () => {
    setLabelToEdit(null);
    setModalMode("create");
    setModalOpen(true);
  };

  const handleEdit = (labelItem: Label, e: React.MouseEvent) => {
    e.stopPropagation();
    setLabelToEdit(labelItem);
    setModalMode("edit");
    setModalOpen(true);
  };

  const handleModalSubmit = (name: string, color: string) => {
    if (modalMode === "create") {
      createLabel.mutate(
        { name, color },
        {
          onSuccess: (newLabel) => {
            toast.success("Rótulo criado com sucesso!");
            setModalOpen(false);
            onValueChange?.(newLabel.id);
          },
          onError: (err) => toast.error(err.message || "Erro ao criar rótulo"),
        },
      );
    } else if (labelToEdit) {
      updateLabel.mutate(
        { id: labelToEdit.id, data: { name, color } },
        {
          onSuccess: () => {
            toast.success("Rótulo atualizado com sucesso!");
            setModalOpen(false);
            setLabelToEdit(null);
          },
          onError: (err) =>
            toast.error(err.message || "Erro ao atualizar rótulo"),
        },
      );
    }
  };

  const handleDelete = () => {
    if (!labelToEdit) return;
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!labelToEdit) return;

    deleteLabelMutation.mutate(labelToEdit.id, {
      onSuccess: () => {
        toast.success("Rótulo excluído com sucesso!");
        setModalOpen(false);
        setDeleteConfirmOpen(false);
        if (value === labelToEdit.id) onValueChange?.(undefined);
        setLabelToEdit(null);
      },
      onError: (err) => {
        toast.error(err.message || "Erro ao excluir rótulo");
        setDeleteConfirmOpen(false);
      },
    });
  };

  return (
    <>
      <div className={cn("flex flex-col gap-1.5", className)}>
        {label && (
          <FieldLabel
            htmlFor={id}
            className={cn(disabled && "opacity-50", error && "text-destructive")}
          >
            {label}
          </FieldLabel>
        )}
        <Popover onOpenChange={setOpen} open={open}>
          <PopoverTrigger asChild>
            <Button
              aria-expanded={open}
              className={cn(
                "w-full justify-between border-input bg-background px-3 font-normal hover:bg-background",
                error && "border-destructive",
                disabled && "cursor-not-allowed opacity-50",
              )}
              id={id}
              role="combobox"
              variant="outline"
              disabled={disabled}
            >
              <span
                className={cn(
                  "flex flex-1 items-center gap-2 truncate text-left",
                  !hasValue && "text-muted-foreground",
                )}
              >
                {selectedLabel ? (
                  <>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: selectedLabel.color }}
                    />
                    {selectedLabel.name}
                  </>
                ) : (
                  placeholder || label
                )}
              </span>
              <ChevronDownIcon
                aria-hidden="true"
                className="shrink-0 text-muted-foreground/80"
                size={16}
              />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="start"
            className="w-full min-w-[var(--radix-popper-anchor-width)] border-input p-0"
          >
            <Command>
              <CommandInput placeholder="Buscar rótulo..." />
              <CommandList>
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Carregando...
                  </div>
                ) : (
                  <>
                    {labels.length === 0 ? (
                      <CommandEmpty>Nenhum rótulo encontrado.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {labels.map((labelItem) => (
                          <CommandItem
                            key={labelItem.id}
                            value={`${labelItem.id} ${labelItem.name}`}
                            onSelect={() => handleSelect(labelItem.id)}
                            className="cursor-pointer p-0"
                          >
                            <LabelSelectItem
                              label={labelItem}
                              isSelected={value === labelItem.id}
                              onSelect={() => handleSelect(labelItem.id)}
                              onEdit={(e) => handleEdit(labelItem, e)}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                    <div className="border-t p-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={handleCreateNew}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Rótulo
                      </Button>
                    </div>
                  </>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <LabelModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleModalSubmit}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
        mode={modalMode}
        labelId={labelToEdit?.id}
        initialName={labelToEdit?.name}
        initialColor={labelToEdit?.color}
        isLoading={
          modalMode === "create" ? createLabel.isPending : updateLabel.isPending
        }
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={handleConfirmDelete}
        title="Excluir rótulo"
        description={`Tem certeza que deseja excluir o rótulo "${labelToEdit?.name}"? Esta ação não pode ser desfeita.`}
        confirmVariant="destructive"
        confirmLabel="Excluir"
        isConfirming={deleteLabelMutation.isPending}
      />
    </>
  );
}
