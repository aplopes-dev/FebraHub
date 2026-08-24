'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Input } from '@citybox/ui/atoms';
import type { CommissionProfessionalSuggestion } from '../hooks/use-commission-filters';

type ProfessionalSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  suggestions: CommissionProfessionalSuggestion[];
  onSelect: (id: string, name: string) => void;
  selectedName?: string;
  onClear: () => void;
};

export function ProfessionalSearchInput({
  value,
  onChange,
  suggestions,
  onSelect,
  selectedName,
  onClear,
}: ProfessionalSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const showDropdown = isFocused && suggestions.length > 0 && !selectedName;

  return (
    <div className="relative" ref={containerRef}>
      {selectedName ? (
        /* Badge do profissional selecionado */
        <div className="flex h-9 min-w-[220px] items-center gap-2 rounded-md border border-border bg-background px-3">
          <span className="flex-1 truncate text-sm">{selectedName}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-5 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onClear}
            aria-label="Limpar profissional selecionado"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        </div>
      ) : (
        <Input
          placeholder="Buscar profissional"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Pequeno delay para permitir clique no dropdown
            setTimeout(() => setIsFocused(false), 150);
          }}
          className="min-w-[220px]"
          aria-label="Buscar profissional"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
      )}

      {/* Dropdown de sugestões */}
      {showDropdown ? (
        <ul
          role="listbox"
          className={cn(
            'absolute top-full left-0 z-20 mt-1 min-w-full overflow-hidden',
            'rounded-md border border-border bg-background shadow-md',
          )}
        >
          {suggestions.map((professional) => (
            <li key={professional.id} role="option" aria-selected={false}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted/60 focus:bg-muted/60 focus:outline-none"
                onMouseDown={(e) => {
                  // Previne blur antes do clique
                  e.preventDefault();
                  onSelect(professional.id, professional.name);
                }}
              >
                {professional.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
