'use client';

import { Plus } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';
import { Can } from '@/features/clinic/permissions';

type PatientBudgetsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onNewBudget: () => void;
};

export function PatientBudgetsToolbar({
  search,
  onSearchChange,
  onNewBudget,
}: PatientBudgetsToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="w-full min-w-[12rem] flex-1 sm:max-w-md">
        <SearchInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar orçamentos…"
          className="h-9 w-full border-border bg-card"
          aria-label="Buscar orçamentos"
        />
      </div>

      <Can action="create" subject="PatientBudget">
        <Button type="button" onClick={onNewBudget} className="shrink-0">
          <Plus className="mr-2 size-4" aria-hidden />
          Novo orçamento
        </Button>
      </Can>
    </div>
  );
}
