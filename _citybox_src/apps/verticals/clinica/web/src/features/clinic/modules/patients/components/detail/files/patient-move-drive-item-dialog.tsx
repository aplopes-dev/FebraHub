'use client';

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@citybox/ui';
import { ModalForm } from '@citybox/ui/organisms';
import type { PatientDriveMoveDestination } from '../../../types/patient-file';

type PatientMoveDriveItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  destinations: PatientDriveMoveDestination[];
  isLoading?: boolean;
  onMove: (destinationId: string | null) => Promise<void>;
};

export function PatientMoveDriveItemDialog({
  open,
  onOpenChange,
  itemName,
  destinations,
  isLoading = false,
  onMove,
}: PatientMoveDriveItemDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
    }
  }, [open]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onMove(selectedId);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }, [onMove, onOpenChange, selectedId]);

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Mover"
      subtitle={`Selecione o destino para "${itemName}".`}
      saveLabel="Mover"
      isSaving={isSaving}
      saveDisabled={isLoading}
      onSave={handleSave}
      contentClassName="bg-background p-0 sm:max-w-md"
    >
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando pastas…</p>
        ) : (
          destinations.map((destination) => {
            const isSelected = selectedId === destination.id;

            return (
              <button
                key={destination.id ?? 'root'}
                type="button"
                onClick={() => setSelectedId(destination.id)}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5 text-foreground'
                    : 'border-border/60 text-foreground hover:bg-muted/40',
                )}
              >
                {destination.label}
              </button>
            );
          })
        )}
      </div>
    </ModalForm>
  );
}
