'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input } from '@citybox/ui/atoms';
import { ModalForm } from '@citybox/ui/organisms';
import { validatePatientFolderName } from '../../../lib/patient-file-mime';

type PatientRenameDriveItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  onRename: (name: string) => Promise<void>;
};

export function PatientRenameDriveItemDialog({
  open,
  onOpenChange,
  initialName,
  onRename,
}: PatientRenameDriveItemDialogProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError(undefined);
    }
  }, [initialName, open]);

  const handleSave = useCallback(async () => {
    const validation = validatePatientFolderName(name);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsSaving(true);
    try {
      await onRename(name.trim());
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }, [name, onOpenChange, onRename]);

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Renomear"
      saveLabel="Salvar"
      isSaving={isSaving}
      saveDisabled={!name.trim() || name.trim() === initialName.trim()}
      onSave={handleSave}
      contentClassName="bg-background p-0 sm:max-w-md"
      footerClassName="border-t-0"
    >
      <div className="space-y-1.5">
        <Input
          id="patient-drive-item-rename"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          placeholder="Digite o novo nome"
          aria-label="Digite o novo nome"
          aria-invalid={Boolean(error)}
          autoFocus
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </ModalForm>
  );
}
