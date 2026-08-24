'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
import type {
  PatientCategory,
  PatientCategoryInput,
} from '@/features/clinic/modules/patients/types/patient-category';

type PatientCategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingCategory: PatientCategory | null;
  onSave: (input: PatientCategoryInput) => void | Promise<void>;
};

export function PatientCategoryFormDialog({
  open,
  onOpenChange,
  editingCategory,
  onSave,
}: PatientCategoryFormDialogProps) {
  const [name, setName] = useState('');
  const [colorId, setColorId] = useState(DEFAULT_CATEGORY_HEX);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setName(editingCategory?.name ?? '');
    setColorId(normalizeCategoryHex(editingCategory?.colorId));
    setError(null);
  }, [editingCategory, open]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome da categoria.');
      return;
    }

    await onSave({ name: trimmedName, colorId: normalizeCategoryHex(colorId) });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-md" showCloseButton={false}>
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <DialogHeader className="gap-0">
            <DialogTitle>{editingCategory ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          </DialogHeader>
          <DialogClose asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar">
              <X className="size-4" aria-hidden />
            </Button>
          </DialogClose>
        </div>

        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="clinic-patient-category-name">Nome</Label>
            <Input
              id="clinic-patient-category-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Nome da categoria"
              autoFocus
              aria-invalid={!!error}
            />
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <CategoryColorField
            id="clinic-patient-category-color"
            value={colorId}
            onChange={setColorId}
          />
        </div>

        <DialogFooter className="border-t border-border/60 px-5 py-4 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSave()}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
