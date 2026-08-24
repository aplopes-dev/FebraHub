'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Plus, Search } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Input } from '@citybox/ui/atoms';
import type { PlanSpecialtyItem, PlanTreatmentItem } from '../types/clinic-plan-specialty';
import { PlanTreatmentCard } from './plan-treatment-card';

type PlanTreatmentsPanelProps = {
  specialty: PlanSpecialtyItem | null;
  disabled?: boolean;
  /** Cria o tratamento e, se possível, devolve o id para scroll/foco. */
  onAddTreatment: () => string | void;
  onUpdateTreatment: (
    treatmentId: string,
    patch: Partial<
      Pick<PlanTreatmentItem, 'name' | 'treatmentValue' | 'treatmentCost' | 'enabled' | 'acceptsFaces'>
    >,
  ) => void;
  onRemoveTreatment: (treatmentId: string) => void;
};

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function focusAndRevealTreatmentCard(treatmentId: string) {
  const card = document.getElementById(`treatment-card-${treatmentId}`);
  const input = document.getElementById(
    `${treatmentId}-name`,
  ) as HTMLInputElement | null;

  // Alinha o card pelo fim do viewport do scroll — valores ficam visíveis, não só o nome.
  card?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  input?.focus({ preventScroll: true });
}

export function PlanTreatmentsPanel({
  specialty,
  disabled = false,
  onAddTreatment,
  onUpdateTreatment,
  onRemoveTreatment,
}: PlanTreatmentsPanelProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [specialty?.id]);

  useEffect(() => {
    if (!isSearchOpen) return;
    searchInputRef.current?.focus();
  }, [isSearchOpen]);

  const filteredTreatments = useMemo(() => {
    if (!specialty) return [];

    const query = normalizeSearchText(searchQuery);
    if (!query) return specialty.treatments;

    return specialty.treatments.filter((treatment) =>
      normalizeSearchText(treatment.name).includes(query),
    );
  }, [searchQuery, specialty]);

  if (!specialty) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Selecione uma especialidade para gerenciar os procedimentos.
      </div>
    );
  }

  const specialtyTitle = specialty.name.trim();
  const hasTreatments = specialty.treatments.length > 0;
  const hasFilteredResults = filteredTreatments.length > 0;

  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const handleSearchTrigger = () => {
    if (disabled || !hasTreatments) return;

    if (isSearchOpen && !searchQuery.trim()) {
      closeSearch();
      return;
    }

    setIsSearchOpen(true);
  };

  const handleAddTreatment = () => {
    if (disabled) return;

    // Limpa a busca para o item novo (nome vazio) aparecer na lista.
    let createdId: string | void;
    flushSync(() => {
      setIsSearchOpen(false);
      setSearchQuery('');
      createdId = onAddTreatment();
    });

    if (!createdId) return;

    focusAndRevealTreatmentCard(createdId);
    window.setTimeout(() => focusAndRevealTreatmentCard(createdId!), 0);
    window.setTimeout(() => focusAndRevealTreatmentCard(createdId!), 50);
  };

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-4">
        {specialtyTitle ? (
          <h3
            className={cn(
              'min-w-0 truncate text-base font-bold text-foreground transition-opacity',
              isSearchOpen && 'opacity-60',
            )}
          >
            {specialtyTitle}
          </h3>
        ) : (
          <span className="min-h-6 flex-1" aria-hidden />
        )}

        <div className="flex shrink-0 items-center gap-2">
          <div
            className={cn(
              'flex h-9 items-center overflow-hidden rounded-md border border-input bg-background shadow-xs transition-[width] duration-200 ease-out',
              isSearchOpen ? 'w-56' : 'w-9',
              (disabled || !hasTreatments) && 'pointer-events-none opacity-50',
            )}
          >
            <button
              type="button"
              disabled={disabled || !hasTreatments}
              aria-label="Buscar procedimento"
              aria-expanded={isSearchOpen}
              className="flex size-9 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              onClick={handleSearchTrigger}
            >
              <Search className="size-4" aria-hidden />
            </button>

            <Input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              disabled={disabled || !isSearchOpen}
              placeholder="Buscar procedimento..."
              aria-label="Buscar procedimento por nome"
              className={cn(
                'h-9 min-w-0 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0',
                isSearchOpen ? 'w-full pr-3 opacity-100' : 'w-0 opacity-0',
              )}
              onChange={(event) => setSearchQuery(event.target.value)}
              onBlur={() => {
                if (!searchQuery.trim()) {
                  closeSearch();
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  closeSearch();
                }
              }}
            />
          </div>

          <Button
            type="button"
            size="icon"
            disabled={disabled}
            aria-label="Adicionar procedimento"
            onClick={handleAddTreatment}
          >
            <Plus className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {hasTreatments ? (
          hasFilteredResults ? (
            <div className="space-y-4">
              {filteredTreatments.map((treatment) => (
                <PlanTreatmentCard
                  key={treatment.id}
                  treatment={treatment}
                  disabled={disabled}
                  onUpdate={(patch) => onUpdateTreatment(treatment.id, patch)}
                  onRemove={() => onRemoveTreatment(treatment.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center">
              <p className="text-sm font-medium text-foreground">Nenhum procedimento encontrado</p>
              <p className="text-sm text-muted-foreground">Tente outro termo ou limpe a busca.</p>
            </div>
          )
        ) : (
          <div className="flex h-full min-h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum procedimento cadastrado nesta especialidade.
            </p>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={handleAddTreatment}>
              <Plus className="mr-2 size-4" aria-hidden />
              Adicionar procedimento
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
