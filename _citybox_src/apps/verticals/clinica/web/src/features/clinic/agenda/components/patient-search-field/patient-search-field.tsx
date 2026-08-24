"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@citybox/ui";
import { Button } from "@citybox/ui/atoms";
import { Avatar, AvatarFallback, AvatarImage } from "@citybox/ui/atoms";
import { Input, Label } from "@citybox/ui/atoms";

import {
  useSearchPatientsSimple,
  type PatientSimple,
} from "../../hooks/use-search-patients-simple";

type PatientSearchFieldProps = {
  value?: string;
  onChange: (patientId: string | undefined) => void;
  onPatientSelect?: (patient: PatientSimple | null) => void;
  label?: string;
  className?: string;
  error?: boolean;
  disabled?: boolean;
  debounceMs?: number;
  initialName?: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function PatientSearchField({
  value,
  onChange,
  onPatientSelect,
  label = "Paciente",
  className,
  error,
  disabled,
  initialName,
  debounceMs = 500,
}: PatientSearchFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  
  const [localSelectedPatient, setLocalSelectedPatient] = useState<PatientSimple | null>(() => {
    if (value && initialName) {
      return { id: value, name: initialName, phone: null, avatar: null };
    }
    return null;
  });

  // Debounce para evitar requisições a cada letra
  const debouncedSearch = useDebounce(searchTerm, debounceMs);

  // Busca pacientes da API apenas quando há query com pelo menos 1 caractere
  const { data: patients = [], isLoading } = useSearchPatientsSimple(
    debouncedSearch && debouncedSearch.trim().length > 0
      ? debouncedSearch.trim()
      : undefined
  );

  // Update local state if a new patient comes from the API and matches the value (optional fallback)
  useEffect(() => {
    if (value && !localSelectedPatient) {
      const found = patients.find((p) => p.id === value);
      if (found) {
        setLocalSelectedPatient(found);
      }
    }
  }, [value, patients, localSelectedPatient]);

  // Clear local state if value is cleared from outside, or update if initialName changes
  useEffect(() => {
    if (!value) {
      setLocalSelectedPatient(null);
    } else if (value && initialName && localSelectedPatient?.id !== value) {
      setLocalSelectedPatient({ id: value, name: initialName, phone: null, avatar: null });
    }
  }, [value, initialName]);

  // Mostra o nome do paciente selecionado ou o termo de busca
  const displayValue = localSelectedPatient ? localSelectedPatient.name : searchTerm;

  const filteredPatients = patients;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPatient = (patient: PatientSimple) => {
    setLocalSelectedPatient(patient);
    onChange(patient.id);
    onPatientSelect?.(patient);
    setSearchTerm("");
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Não permite digitar quando já tem paciente selecionado
    if (localSelectedPatient) return;

    setSearchTerm(e.target.value);
    setIsOpen(true);
  };

  const handleClearPatient = () => {
    setLocalSelectedPatient(null);
    onChange(undefined);
    onPatientSelect?.(null);
    setSearchTerm("");
  };

  const hasSelectedPatient = !!localSelectedPatient;

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-col gap-1.5">
        <Label className={cn(error && "text-destructive")}>{label}</Label>
        <div className="relative">
          <Input
            value={displayValue}
            onChange={handleInputChange}
            onFocus={() => !hasSelectedPatient && setIsOpen(true)}
            disabled={disabled}
            readOnly={hasSelectedPatient}
            aria-invalid={error}
            className={cn(
              "peer ps-9",
              error && "border-destructive",
              hasSelectedPatient && "pr-10",
              className,
            )}
          />
          <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
            <Search aria-hidden="true" size={16} />
          </div>
          {hasSelectedPatient && !disabled && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute end-1 inset-y-0 my-auto size-8"
              onClick={handleClearPatient}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover shadow-md">
          {!debouncedSearch || debouncedSearch.trim().length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Digite para buscar pacientes
            </div>
          ) : isLoading ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Carregando...
            </div>
          ) : filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <button
                key={patient.id}
                type="button"
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                onClick={() => handleSelectPatient(patient)}
              >
                <Avatar className="size-8">
                  <AvatarImage
                    src={patient.avatar || undefined}
                    alt={patient.name}
                  />
                  <AvatarFallback className="text-xs">
                    {getInitials(patient.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{patient.name}</p>
                  {patient.phone && (
                    <p className="text-xs text-muted-foreground truncate">
                      {patient.phone}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className="p-4 text-sm text-muted-foreground text-center">
              Nenhum paciente encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { PatientSearchField };
