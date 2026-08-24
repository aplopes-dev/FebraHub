'use client';

import { useRef, useState, useId } from 'react';
import { ChevronDown, Plus, Loader2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Label, Popover, PopoverContent, PopoverTrigger } from '@citybox/ui/atoms';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import { resolveAppointmentCategoryColor } from '@/features/clinic/agenda/lib/appointment-category-colors';
import { AppointmentCategoryCreatePopover } from '@/features/clinic/agenda/components/appointment-category-create-popover';
import { useCategories, useCreateCategory } from '../../hooks/use-categories';
import { ClinicaApiError } from '@/features/clinic/shared/api';
import { Can } from '@/features/clinic/permissions';
import { toast } from 'sonner';

const CATEGORY_TRIGGER_CLASS =
  'flex h-9 w-full items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

type CategorySelectProps = {
  value: string | null | undefined;
  onValueChange: (value: string) => void;
  label?: string;
  className?: string;
  id?: string;
  error?: boolean;
  disabled?: boolean;
};

function CategorySelect({
  value,
  onValueChange,
  label = 'Categoria',
  className,
  id: externalId,
  error,
  disabled,
}: CategorySelectProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const anchorRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: categories = [], isLoading, isError } = useCategories();
  const createCategoryMutation = useCreateCategory();

  const selectedCategory = categories.find((category) => category.id === value);
  const isDisabled = disabled || isLoading;

  const handleCreate = async (input: { name: string; color: string }) => {
    try {
      const category = await createCategoryMutation.mutateAsync(input);
      onValueChange(category.id);
      toast.success('Categoria criada com sucesso.');
    } catch (err) {
      toast.error(
        err instanceof ClinicaApiError ? err.message : 'Não foi possível criar a categoria.',
      );
      throw err;
    }
  };

  const handleAddCategoryClick = () => {
    setDropdownOpen(false);
    setCreateOpen(true);
  };

  const handleSelectCategory = (categoryId: string) => {
    onValueChange(categoryId);
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-1.5">
      {label ? (
        <Label
          htmlFor={id}
          className={cn(isDisabled && 'opacity-50', error && 'text-destructive')}
        >
          {label}
        </Label>
      ) : null}
      <div ref={anchorRef}>
        <Popover open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
          <PopoverTrigger asChild>
            <button
              id={id}
              type="button"
              role="combobox"
              aria-expanded={dropdownOpen}
              disabled={isDisabled}
              className={cn(
                CATEGORY_TRIGGER_CLASS,
                !selectedCategory && 'text-muted-foreground',
                error && 'border-destructive aria-invalid:border-destructive',
                className,
              )}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Carregando...
                </span>
              ) : selectedCategory ? (
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{
                      backgroundColor: resolveAppointmentCategoryColor(selectedCategory.color),
                    }}
                    aria-hidden
                  />
                  <span className="truncate">{selectedCategory.name}</span>
                </span>
              ) : (
                <span>Selecionar</span>
              )}
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            sideOffset={4}
            className={cn(
              'w-[var(--radix-popover-trigger-width)] gap-0 p-0',
              CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS,
            )}
          >
            <div className="p-1.5">
              {isError ? (
                <p className="px-3 py-2 text-sm text-destructive">
                  Não foi possível carregar as categorias.
                </p>
              ) : categories.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhuma categoria cadastrada
                </p>
              ) : (
                categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      value === category.id && 'bg-accent text-accent-foreground',
                    )}
                    onClick={() => handleSelectCategory(category.id)}
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{
                        backgroundColor: resolveAppointmentCategoryColor(category.color),
                      }}
                      aria-hidden
                    />
                    {category.name}
                  </button>
                ))
              )}
            </div>
            <div className="border-t border-border/60 p-1.5">
              <Can action="create" subject="Category">
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 w-full justify-start gap-2 px-2 font-normal"
                  onClick={handleAddCategoryClick}
                >
                  <Plus className="size-4" aria-hidden />
                  Adicionar categoria
                </Button>
              </Can>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {createOpen ? (
        <AppointmentCategoryCreatePopover
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={handleCreate}
          anchorRef={anchorRef}
        />
      ) : null}
    </div>
  );
}

export { CategorySelect };
