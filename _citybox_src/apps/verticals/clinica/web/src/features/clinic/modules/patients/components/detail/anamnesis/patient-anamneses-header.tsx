'use client';

import { Plus } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';

type PatientAnamnesesHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onNewAnamnesis: () => void;
};

export function PatientAnamnesesHeader({
  search,
  onSearchChange,
  onNewAnamnesis,
}: PatientAnamnesesHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="w-full min-w-[12rem] flex-1 sm:max-w-md">
        <SearchInput
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar anamneses…"
          className="h-9 w-full border-border bg-card"
          aria-label="Buscar anamneses"
        />
      </div>

      <Button type="button" onClick={onNewAnamnesis} className="shrink-0">
        <Plus className="mr-2 size-4" aria-hidden />
        Nova anamnese
      </Button>
    </div>
  );
}
