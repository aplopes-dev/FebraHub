'use client';

import { useEffect, useState, type RefObject } from 'react';
import { X } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Button,
  Input,
  Label,
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@citybox/ui/atoms';
import { CategoryColorField } from '@/features/clinic/components/category-color-field';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import {
  DEFAULT_CATEGORY_HEX,
  normalizeCategoryHex,
} from '@/features/clinic/lib/normalize-category-hex';

type AppointmentCategoryCreatePopoverProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: { name: string; color: string }) => void | Promise<void>;
  anchorRef: RefObject<HTMLDivElement | null>;
};

export function AppointmentCategoryCreatePopover({
  open,
  onOpenChange,
  onCreate,
  anchorRef,
}: AppointmentCategoryCreatePopoverProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_CATEGORY_HEX);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setName('');
      setColor(DEFAULT_CATEGORY_HEX);
      setError(null);
    }
  }, [open]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome da categoria.');
      return;
    }

    await onCreate({ name: trimmedName, color: normalizeCategoryHex(color) });
    onOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange} modal={false}>
      <PopoverAnchor
        virtualRef={anchorRef as RefObject<{ getBoundingClientRect: () => DOMRect }>}
      />
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn('w-80 gap-0 p-0', CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS)}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h4 className="text-base font-semibold text-foreground">Nova Categoria</h4>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Fechar"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-1.5">
            <Label htmlFor="appointment-category-name">Nome</Label>
            <Input
              id="appointment-category-name"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (error) setError(null);
              }}
              placeholder="Nome"
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
            id="appointment-category-create-color"
            value={color}
            onChange={setColor}
          />
        </div>

        <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void handleSave()}>
            Salvar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
