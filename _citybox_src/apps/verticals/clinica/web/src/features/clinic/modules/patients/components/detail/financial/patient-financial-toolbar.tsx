'use client';

import { SearchInput } from '@citybox/ui/molecules';

type PatientFinancialToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
};

export function PatientFinancialToolbar({
  search,
  onSearchChange,
}: PatientFinancialToolbarProps) {
  return (
    <div className="w-full min-w-[12rem] sm:max-w-md">
      <SearchInput
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Buscar lançamentos…"
        className="h-9 w-full border-border bg-card"
        aria-label="Buscar lançamentos"
      />
    </div>
  );
}
