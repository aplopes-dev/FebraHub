'use client';

import { useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@citybox/ui/atoms';
import type { PlanSpecialtyItem } from '../types/clinic-plan-specialty';

type SpecialtyNameInputProps = {
  specialtyId: string;
  value: string;
  disabled?: boolean;
  /** Só o item recém-criado / em edição explícita deve roubar o foco. */
  autoFocus?: boolean;
  onChange: (name: string) => void;
  onEditComplete: () => void;
};

/**
 * Edição do nome: NÃO encerra no blur (Sheet/menu disparam blur fantasma).
 * Sai só com Enter / Escape.
 */
function SpecialtyNameInput({
  specialtyId,
  value,
  disabled = false,
  autoFocus = false,
  onChange,
  onEditComplete,
}: SpecialtyNameInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    if (!autoFocus || disabled) return;

    const input = inputRef.current;
    if (!input) return;

    const focusInput = () => {
      if (!input.isConnected) return;
      input.focus({ preventScroll: true });
      if (document.activeElement === input && !input.value.trim()) {
        input.select();
      }
    };

    focusInput();
    const t1 = window.setTimeout(focusInput, 0);
    const t2 = window.setTimeout(focusInput, 50);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [specialtyId, autoFocus, disabled]);

  return (
    <input
      ref={inputRef}
      id={`specialty-name-${specialtyId}`}
      type="text"
      value={value}
      disabled={disabled}
      placeholder="Nome da especialidade"
      aria-label="Nome da especialidade"
      autoComplete="off"
      className={cn(
        'h-8 min-w-0 flex-1 rounded-3xl border border-primary/30 bg-background px-3 py-1 text-sm outline-none',
        'transition-[color,box-shadow,background-color]',
        'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30',
        'placeholder:text-muted-foreground',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
      )}
      onChange={(event) => onChange(event.target.value)}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          onEditComplete();
        }
        if (event.key === 'Escape') {
          event.preventDefault();
          onEditComplete();
        }
      }}
    />
  );
}

type PlanSpecialtiesSidebarProps = {
  specialties: PlanSpecialtyItem[];
  selectedSpecialtyId: string | null;
  editingSpecialtyNameId: string | null;
  disabled?: boolean;
  onSelectSpecialty: (specialtyId: string) => void;
  onEditSpecialty: (specialtyId: string) => void;
  onDeleteSpecialty: (specialtyId: string) => void;
  onUpdateSpecialtyName: (specialtyId: string, name: string) => void;
  onSpecialtyNameEditComplete: () => void;
  /** Deve criar a especialidade, abrir edição e retornar o id. */
  onCreateSpecialty: () => string;
};

function focusSpecialtyNameInput(specialtyId: string) {
  const input = document.getElementById(
    `specialty-name-${specialtyId}`,
  ) as HTMLInputElement | null;
  if (!input) return;
  input.focus({ preventScroll: true });
  if (!input.value.trim()) {
    input.select();
  }
}

export function PlanSpecialtiesSidebar({
  specialties,
  selectedSpecialtyId,
  editingSpecialtyNameId,
  disabled = false,
  onSelectSpecialty,
  onEditSpecialty,
  onDeleteSpecialty,
  onUpdateSpecialtyName,
  onSpecialtyNameEditComplete,
  onCreateSpecialty,
}: PlanSpecialtiesSidebarProps) {
  const handleCreateSpecialty = () => {
    // flushSync garante que o <input> já existe no DOM antes do focus.
    let createdId = '';
    flushSync(() => {
      createdId = onCreateSpecialty();
    });
    if (!createdId) return;
    focusSpecialtyNameInput(createdId);
    window.setTimeout(() => focusSpecialtyNameInput(createdId), 0);
    window.setTimeout(() => focusSpecialtyNameInput(createdId), 50);
  };

  return (
    <aside className="flex max-h-56 min-h-0 w-full min-w-0 shrink-0 flex-col border-b border-border/60 bg-muted/20 md:max-h-none md:h-full md:shrink md:border-r md:border-b-0">
      <div className="shrink-0 border-b border-border/60 px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">Especialidades</h3>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {specialties.map((specialty) => {
            const isSelected = specialty.id === selectedSpecialtyId;
            const nameIsEmpty = !specialty.name.trim();
            // Sem nome: sempre input (nunca o botão "Sem nome" que força o menu Editar).
            // Com nome: input só no editingId explícito.
            const isEditingName =
              specialty.id === editingSpecialtyNameId || nameIsEmpty;
            const specialtyLabel = specialty.name.trim() || 'Sem nome';

            return (
              <li key={specialty.id}>
                <div
                  className={cn(
                    'flex items-center gap-0.5 rounded-lg border pr-1 transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:bg-muted/60',
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                    {isEditingName ? (
                      <SpecialtyNameInput
                        specialtyId={specialty.id}
                        value={specialty.name}
                        disabled={disabled}
                        autoFocus={specialty.id === editingSpecialtyNameId}
                        onChange={(name) => {
                          // Trava editingId antes/junto da 1ª letra (senão nameIsEmpty
                          // vira false e o input desmontaria sem editingId).
                          if (specialty.id !== editingSpecialtyNameId) {
                            onEditSpecialty(specialty.id);
                          }
                          onUpdateSpecialtyName(specialty.id, name);
                        }}
                        onEditComplete={onSpecialtyNameEditComplete}
                      />
                    ) : (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => {
                          onSpecialtyNameEditComplete();
                          onSelectSpecialty(specialty.id);
                        }}
                        className={cn(
                          'flex min-w-0 flex-1 items-center gap-2 text-left text-sm',
                          isSelected ? 'font-medium text-foreground' : 'text-foreground',
                        )}
                      >
                        <span className="truncate">{specialtyLabel}</span>
                      </button>
                    )}

                    <Badge
                      variant="outline"
                      className={cn(
                        'shrink-0 px-1.5 text-[10px] font-normal',
                        isSelected && 'border-primary/30 text-primary',
                      )}
                    >
                      {specialty.treatments.length}
                    </Badge>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        aria-label={`Ações da especialidade ${specialtyLabel}`}
                        className="size-8 shrink-0 text-muted-foreground hover:text-foreground"
                        onClick={(event) => event.stopPropagation()}
                        onMouseDown={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" aria-hidden />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        disabled={disabled}
                        onSelect={() => onEditSpecialty(specialty.id)}
                      >
                        <Pencil className="mr-2 size-4" aria-hidden />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={disabled}
                        variant="destructive"
                        onSelect={() => onDeleteSpecialty(specialty.id)}
                      >
                        <Trash2 className="mr-2 size-4" aria-hidden />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto shrink-0 border-t border-border/60 p-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={disabled}
          onMouseDown={(event) => event.preventDefault()}
          onClick={handleCreateSpecialty}
        >
          <Plus className="mr-2 size-4" aria-hidden />
          Criar especialidade
        </Button>
      </div>
    </aside>
  );
}
