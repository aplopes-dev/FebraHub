'use client';

import { Plus } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';

type PatientsHeaderProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onNewPatient: () => void;
  canCreate?: boolean;
};

export function PatientsHeader({
  search,
  onSearchChange,
  onNewPatient,
  canCreate = true,
}: PatientsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pacientes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie seus pacientes aqui</p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <div className="w-full sm:w-80">
          <SearchInput
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nome, CPF ou celular…"
            className="h-10 w-full border-border bg-card"
            aria-label="Buscar pacientes"
          />
        </div>
        {canCreate ? (
          <Button type="button" size="lg" onClick={onNewPatient}>
            <Plus className="mr-2 size-4" aria-hidden />
            Novo Paciente
          </Button>
        ) : null}
      </div>
    </div>
  );
}
