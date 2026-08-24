'use client';

import { useRef, useState, type MouseEvent } from 'react';
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Label, Popover, PopoverContent, PopoverTrigger } from '@citybox/ui/atoms';
import { ConfirmDialog } from '@citybox/ui/organisms';
import { CLINIC_NESTED_SHEET_POPOVER_CONTENT_CLASS } from '@/features/clinic/lib/clinic-sheet-styles';
import type {
  ExternalReferralProfessional,
  ExternalReferralProfessionalInput,
} from '../types/external-referral-professional';
import { ExternalProfessionalFormPopover } from './external-professional-create-popover';

const TRIGGER_CLASS =
  'flex h-9 w-full items-center justify-between gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50';

type ExternalProfessionalFieldProps = {
  professionals: ExternalReferralProfessional[];
  professionalId?: string;
  professionalName?: string;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  onChange: (professionalId: string | null, professionalName: string | null) => void;
  onCreate: (
    input: ExternalReferralProfessionalInput,
  ) => Promise<ExternalReferralProfessional>;
  onUpdate: (
    id: string,
    input: ExternalReferralProfessionalInput,
  ) => Promise<ExternalReferralProfessional>;
  onDelete: (id: string) => Promise<void>;
};

export function ExternalProfessionalField({
  professionals,
  professionalId,
  professionalName,
  disabled = false,
  error = false,
  errorMessage,
  onChange,
  onCreate,
  onUpdate,
  onDelete,
}: ExternalProfessionalFieldProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<ExternalReferralProfessional | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExternalReferralProfessional | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const selected =
    professionals.find((item) => item.id === professionalId) ??
    (professionalId && professionalName
      ? { id: professionalId, name: professionalName, phone: '', cro: '' }
      : undefined);

  const handleCreate = async (input: ExternalReferralProfessionalInput) => {
    const professional = await onCreate(input);
    onChange(professional.id, professional.name);
  };

  const handleUpdate = async (input: ExternalReferralProfessionalInput) => {
    if (!editing) return;
    const professional = await onUpdate(editing.id, input);
    if (professionalId === professional.id) {
      onChange(professional.id, professional.name);
    }
  };

  const handleAddClick = () => {
    setDropdownOpen(false);
    setEditing(null);
    setFormMode('create');
    setFormOpen(true);
  };

  const handleEditClick = (
    event: MouseEvent,
    professional: ExternalReferralProfessional,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDropdownOpen(false);
    setEditing(professional);
    setFormMode('edit');
    setFormOpen(true);
  };

  const handleDeleteClick = (
    event: MouseEvent,
    professional: ExternalReferralProfessional,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDropdownOpen(false);
    setPendingDelete(professional);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(pendingDelete.id);
      if (professionalId === pendingDelete.id) {
        onChange(null, null);
      }
      setPendingDelete(null);
    } catch {
      // toast já tratado no hook
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelect = (professional: ExternalReferralProfessional) => {
    onChange(professional.id, professional.name);
    setDropdownOpen(false);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor="patient-external-professional">Profissional externo que indicou</Label>
      <div ref={anchorRef}>
        <Popover open={dropdownOpen} onOpenChange={setDropdownOpen} modal={false}>
          <PopoverTrigger asChild>
            <button
              id="patient-external-professional"
              type="button"
              role="combobox"
              aria-expanded={dropdownOpen}
              disabled={disabled}
              aria-invalid={error}
              className={cn(TRIGGER_CLASS, !selected && 'text-muted-foreground')}
            >
              {selected ? (
                <span className="truncate">{selected.name}</span>
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
            <div className="max-h-60 overflow-y-auto p-1.5">
              {professionals.length === 0 ? (
                <p className="px-3 py-2 text-sm text-muted-foreground">
                  Nenhum profissional cadastrado
                </p>
              ) : (
                professionals.map((professional) => (
                  <div
                    key={professional.id}
                    className={cn(
                      'flex w-full items-center gap-1 rounded-2xl px-1 py-0.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      professionalId === professional.id &&
                        'bg-accent text-accent-foreground',
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 truncate rounded-2xl px-2 py-2 text-left"
                      onClick={() => handleSelect(professional)}
                    >
                      {professional.name}
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0"
                      aria-label={`Editar ${professional.name}`}
                      disabled={disabled}
                      onClick={(event) => handleEditClick(event, professional)}
                    >
                      <Pencil className="size-3.5" aria-hidden />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="shrink-0 text-destructive hover:text-destructive"
                      aria-label={`Remover ${professional.name}`}
                      disabled={disabled}
                      onClick={(event) => handleDeleteClick(event, professional)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </Button>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-border/60 p-1.5">
              <Button
                type="button"
                variant="ghost"
                className="h-9 w-full justify-start gap-2 px-2 font-normal"
                onClick={handleAddClick}
              >
                <Plus className="size-4" aria-hidden />
                Novo profissional
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {error && errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {formOpen ? (
        <ExternalProfessionalFormPopover
          open={formOpen}
          onOpenChange={setFormOpen}
          mode={formMode}
          initialValues={
            formMode === 'edit' && editing
              ? {
                  name: editing.name,
                  phone: editing.phone,
                  cro: editing.cro,
                }
              : undefined
          }
          onSubmit={(input) => {
            if (formMode === 'edit') {
              void handleUpdate(input).catch(() => undefined);
              return;
            }
            void handleCreate(input).catch(() => undefined);
          }}
          anchorRef={anchorRef}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setPendingDelete(null);
        }}
        title="Remover profissional?"
        description={
          pendingDelete
            ? `Remover “${pendingDelete.name}” do catálogo? Pacientes já vinculados deixam de apontar para este profissional.`
            : ''
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={isDeleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
      />
    </div>
  );
}
