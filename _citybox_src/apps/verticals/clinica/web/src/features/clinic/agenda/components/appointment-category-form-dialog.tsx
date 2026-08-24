'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@citybox/ui/atoms';
import { CategoryColorField } from '@/features/clinic/components/category-color-field';
import {
  DEFAULT_CATEGORY_HEX,
  normalizeCategoryHex,
} from '@/features/clinic/lib/normalize-category-hex';
import type { AppointmentCategoryApi } from '@/features/clinic/agenda/api/types';
import type { CreateCategoryInput } from '@/features/clinic/agenda/api/types';

export type AppointmentCategoryFormInput = CreateCategoryInput;

type AppointmentCategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory?: AppointmentCategoryApi | null;
  onSave: (input: AppointmentCategoryFormInput) => void | Promise<void>;
  isSaving?: boolean;
};

export function AppointmentCategoryFormDialog({
  open,
  onOpenChange,
  editingCategory = null,
  onSave,
  isSaving = false,
}: AppointmentCategoryFormDialogProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_CATEGORY_HEX);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(editingCategory?.name ?? '');
    setColor(
      editingCategory
        ? normalizeCategoryHex(editingCategory.color)
        : DEFAULT_CATEGORY_HEX,
    );
    setError(null);
  }, [editingCategory, open]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome da categoria.');
      return;
    }

    try {
      await onSave({ name: trimmedName, color: normalizeCategoryHex(color) });
      onOpenChange(false);
    } catch {
      // Mantém o diálogo aberto — o chamador exibe o toast de erro.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingCategory ? 'Editar categoria' : 'Nova categoria de agendamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appointment-category-name">Nome</Label>
            <Input
              id="appointment-category-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  void handleSave();
                }
              }}
              aria-invalid={Boolean(error)}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <CategoryColorField
            id="appointment-category-color"
            value={color}
            onChange={setColor}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
