'use client';

import { useCallback, useEffect, useState } from 'react';
import { Input } from '@citybox/ui/atoms';
import { ModalForm } from '@citybox/ui/organisms';
import { validatePatientFolderName } from '../../../lib/patient-file-mime';

type PatientCreateFolderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => Promise<void>;
};

export function PatientCreateFolderDialog({
  open,
  onOpenChange,
  onCreate,
}: PatientCreateFolderDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setError(undefined);
    }
  }, [open]);

  const handleSave = useCallback(async () => {
    const validation = validatePatientFolderName(name);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }

    setIsSaving(true);
    try {
      await onCreate(name.trim());
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  }, [name, onCreate, onOpenChange]);

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title="Nova Pasta"
      saveLabel="Criar"
      isSaving={isSaving}
      saveDisabled={!name.trim()}
      onSave={handleSave}
      contentClassName="bg-background p-0 sm:max-w-md"
      footerClassName="border-t-0"
    >
      <div className="space-y-1.5">
        <Input
          id="patient-folder-name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          placeholder="Digite o nome da pasta"
          aria-label="Digite o nome da pasta"
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
