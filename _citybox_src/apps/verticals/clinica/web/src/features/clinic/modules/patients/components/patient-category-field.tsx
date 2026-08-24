'use client';

import { useRef, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Label, Popover, PopoverContent, PopoverTrigger } from '@citybox/ui/atoms';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import { getPatientCategoryColorHex } from '../lib/patient-category-colors';
import type { PatientCategory, PatientCategoryInput } from '../types/patient-category';
import { PatientCategoryCreatePopover } from './patient-category-create-popover';
import { Can } from '@/features/clinic/permissions';

const CATEGORY_TRIGGER_CLASS =
  'flex h-9 w-full items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

type PatientCategoryFieldProps = {
  categories: PatientCategory[];
  value: string;
  disabled?: boolean;
  onChange: (categoryId: string) => void;
  onCreateCategory: (input: PatientCategoryInput) => Promise<PatientCategory>;
};

export function PatientCategoryField({
  categories,
  value,
  disabled = false,
  onChange,
  onCreateCategory,
}: PatientCategoryFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const selectedCategory = categories.find((category) => category.id === value);

  const handleCreate = async (input: PatientCategoryInput) => {
    const category = await onCreateCategory(input);
    onChange(category.id);
  };

  const handleAddCategoryClick = () => {
    setDropdownOpen(false);
    setCreateOpen(true);
  };

  const handleSelectCategory = (categoryId: string) => {
    onChange(categoryId);
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="patient-category">Categoria do paciente</Label>
      <div ref={anchorRef}>
        <Popover open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
          <PopoverTrigger asChild>
            <button
              id="patient-category"
              type="button"
              role="combobox"
              aria-expanded={dropdownOpen}
              disabled={disabled}
              className={cn(
                CATEGORY_TRIGGER_CLASS,
                !selectedCategory && 'text-muted-foreground',
              )}
            >
              {selectedCategory ? (
                <span className="flex min-w-0 items-center gap-2 truncate">
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: getPatientCategoryColorHex(selectedCategory.colorId) }}
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
              {categories.length === 0 ? (
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
                      style={{ backgroundColor: getPatientCategoryColorHex(category.colorId) }}
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
        <PatientCategoryCreatePopover
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCreate={handleCreate}
          anchorRef={anchorRef}
        />
      ) : null}
    </div>
  );
}
