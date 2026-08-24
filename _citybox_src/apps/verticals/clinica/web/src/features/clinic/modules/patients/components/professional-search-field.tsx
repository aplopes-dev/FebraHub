'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Input, Label } from '@citybox/ui/atoms';
import { useTeamMembers } from '@/features/shared/team/use-team-members';
import type { TeamMember } from '@/features/shared/team/types';

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

type ProfessionalSearchFieldProps = {
  memberId?: string;
  memberName?: string;
  onChange: (memberId: string | undefined, memberName: string | undefined) => void;
  label?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ProfessionalSearchField({
  memberId,
  memberName,
  onChange,
  label = 'Profissional que indicou',
  disabled = false,
  error = false,
  errorMessage,
}: ProfessionalSearchFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { members, isLoading: isMembersLoading } = useTeamMembers();

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(() => {
    if (memberId && memberName) {
      return {
        id: memberId,
        name: memberName,
        username: '',
        firstName: '',
        lastName: '',
        role: '',
        roleLabel: '',
        permissions: [],
        hasPassword: true,
        status: 'active',
      };
    }
    return null;
  });

  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const trimmedDebounced = debouncedSearch.trim();
  const canSearch = trimmedDebounced.length >= MIN_QUERY_LENGTH;

  const filteredMembers = useMemo(() => {
    if (!canSearch) return [];
    const query = trimmedDebounced.toLowerCase();
    return members.filter((member) => member.name.toLowerCase().includes(query));
  }, [canSearch, members, trimmedDebounced]);

  useEffect(() => {
    if (!memberId) {
      setSelectedMember(null);
      return;
    }
    if (memberId && memberName && selectedMember?.id !== memberId) {
      setSelectedMember({
        id: memberId,
        name: memberName,
        username: '',
        firstName: '',
        lastName: '',
        role: '',
        roleLabel: '',
        permissions: [],
        hasPassword: true,
        status: 'active',
      });
    }
  }, [memberId, memberName, selectedMember?.id]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayValue = selectedMember ? selectedMember.name : searchTerm;
  const hasSelectedMember = Boolean(selectedMember);

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member);
    onChange(member.id, member.name);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (hasSelectedMember) return;
    setSearchTerm(event.target.value);
    setIsOpen(true);
  };

  const handleClearMember = () => {
    setSelectedMember(null);
    onChange(undefined, undefined);
    setSearchTerm('');
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      <Label htmlFor="patient-referred-by-member" className={cn(error && 'text-destructive')}>
        {label}
      </Label>
      <div className="relative">
        <Input
          id="patient-referred-by-member"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => !hasSelectedMember && setIsOpen(true)}
          disabled={disabled || isMembersLoading}
          readOnly={hasSelectedMember}
          aria-invalid={error}
          placeholder="Digite para buscar"
          className={cn('peer ps-9', error && 'border-destructive', hasSelectedMember && 'pr-10')}
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
          <Search aria-hidden="true" size={16} />
        </div>
        {hasSelectedMember && !disabled ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
            onClick={handleClearMember}
            aria-label="Limpar profissional"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {isOpen && !hasSelectedMember ? (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          {!canSearch ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Digite pelo menos {MIN_QUERY_LENGTH} caracteres
            </div>
          ) : isMembersLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Carregando...</div>
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-accent"
                onClick={() => handleSelectMember(member)}
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {getInitials(member.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{member.name}</p>
                  {member.roleLabel ? (
                    <p className="truncate text-xs text-muted-foreground">{member.roleLabel}</p>
                  ) : null}
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum profissional encontrado
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
