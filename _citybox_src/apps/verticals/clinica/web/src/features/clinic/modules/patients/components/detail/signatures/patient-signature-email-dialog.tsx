'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
} from '@citybox/ui/atoms';

export type SignatureEmailContinue = {
  email: string;
  dontShowAgain: boolean;
};

type PatientSignatureEmailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  isSubmitting?: boolean;
  onContinue: (input: SignatureEmailContinue) => void | Promise<void>;
};

export function PatientSignatureEmailDialog({
  open,
  onOpenChange,
  patientName,
  isSubmitting = false,
  onContinue,
}: PatientSignatureEmailDialogProps) {
  const [email, setEmail] = useState('');
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setDontShowAgain(false);
  }, [open]);

  const handleContinue = () => {
    void Promise.resolve(
      onContinue({
        email: email.trim(),
        dontShowAgain,
      }),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>E-mail do paciente</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-1">
          <p className="text-sm text-muted-foreground">
            {patientName.trim()
              ? `${patientName} ainda não tem e-mail cadastrado na ficha. Informe um e-mail para envio automático do link (opcional) ou continue sem e-mail.`
              : 'O paciente ainda não tem e-mail cadastrado na ficha. Informe um e-mail para envio automático do link (opcional) ou continue sem e-mail.'}
          </p>
          <div className="space-y-2">
            <Label htmlFor="signature-patient-email">E-mail</Label>
            <Input
              id="signature-patient-email"
              type="email"
              autoComplete="email"
              placeholder="opcional"
              value={email}
              disabled={isSubmitting}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleContinue();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5">
            <Label
              htmlFor="signature-skip-email-prompt"
              className="cursor-pointer text-sm font-normal leading-snug text-foreground"
            >
              Não mostrar novamente para este paciente.
            </Label>
            <Switch
              id="signature-skip-email-prompt"
              checked={dontShowAgain}
              disabled={isSubmitting}
              onCheckedChange={setDontShowAgain}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={isSubmitting} onClick={handleContinue}>
            {isSubmitting ? 'Continuando…' : 'Continuar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
