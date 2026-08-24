"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@citybox/ui/atoms";
import { useStore } from "@/lib/store-context";
import {
  getPatientById,
  updatePatient,
} from "../../../../services/patients.service";
import type { PatientContractEmissionRecord } from "../../../../types/patient-contract-emission";

const ZAPSIGN_PRIVACY_URL = "https://zapsign.com.br/politica-de-privacidade";

export type ContractSignatureResponsibleInput = {
  name: string;
  email: string;
  phone: string;
};

export type ContractSignatureRequestConfirm = {
  responsible: ContractSignatureResponsibleInput;
  signerEmail?: string;
};

type PatientContractSignatureRequestSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: PatientContractEmissionRecord | null;
  clinicName: string;
  patientName: string;
  patientEmail: string;
  defaultResponsible: ContractSignatureResponsibleInput;
  isSubmitting?: boolean;
  onConfirm: (input: ContractSignatureRequestConfirm) => void | Promise<void>;
};

export function PatientContractSignatureRequestSheet({
  open,
  onOpenChange,
  contract,
  clinicName,
  patientName,
  patientEmail,
  defaultResponsible,
  isSubmitting = false,
  onConfirm,
}: PatientContractSignatureRequestSheetProps) {
  const { storeId } = useStore();
  const [emailDraft, setEmailDraft] = useState(patientEmail);
  const [editEmailOpen, setEditEmailOpen] = useState(false);
  const [emailInput, setEmailInput] = useState(patientEmail);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmailDraft(patientEmail);
    setEmailInput(patientEmail);
    setEditEmailOpen(false);
  }, [open, patientEmail]);

  const handleSaveEmail = async () => {
    if (!storeId || !contract) return;
    const nextEmail = emailInput.trim();
    setSavingEmail(true);
    try {
      const { form } = await getPatientById(storeId, contract.patientId);
      await updatePatient(storeId, contract.patientId, {
        ...form,
        email: nextEmail,
      });
      setEmailDraft(nextEmail);
      setEditEmailOpen(false);
      toast.success("E-mail do paciente atualizado.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o e-mail.",
      );
    } finally {
      setSavingEmail(false);
    }
  };

  const handleConfirm = () => {
    const trimmedName = defaultResponsible.name.trim() || clinicName.trim();
    if (!trimmedName) {
      toast.error("Nome da clínica não encontrado.");
      return;
    }

    void Promise.resolve(
      onConfirm({
        responsible: {
          name: trimmedName,
          email: defaultResponsible.email.trim(),
          phone: defaultResponsible.phone.trim(),
        },
        signerEmail: emailDraft.trim() || undefined,
      }),
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Solicitar Assinatura Eletrônica</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-sm">
            <p className="text-foreground">
              Os signatários receberão um e-mail com o documento para assinar.
              Após todos assinarem, o status do documento mudará de
              &quot;pendente&quot; para &quot;assinado&quot;.
            </p>

            <div className="space-y-3">
              <p className="font-medium text-foreground">Signatários:</p>
              <div className="rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">Clínica</p>
                <p className="font-bold">
                  {defaultResponsible.name.trim() || clinicName || "—"}
                </p>
              </div>
              <div className="space-y-1 rounded-lg border border-border bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  Paciente/responsável
                </p>
                <p className="font-bold">
                  {patientName || contract?.patientName || "—"}
                </p>
                {emailDraft ? (
                  <p className="text-xs text-muted-foreground">{emailDraft}</p>
                ) : (
                  <p className="text-xs text-amber-600">
                    E-mail não cadastrado — o envio automático não ocorrerá para
                    este signatário.
                  </p>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto px-0 text-primary hover:bg-transparent hover:text-primary"
                  onClick={() => {
                    setEmailInput(emailDraft);
                    setEditEmailOpen(true);
                  }}
                >
                  Editar e-mail
                </Button>
              </div>
            </div>

            <p className="text-sm leading-snug text-foreground">
              Ao continuar, aceito o tratamento dos meus dados pessoais de
              acordo com a{" "}
              <a
                href={ZAPSIGN_PRIVACY_URL}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline underline-offset-2"
              >
                política de privacidade
              </a>{" "}
              da ZapSign.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Fechar
            </Button>
            <Button
              type="button"
              disabled={isSubmitting || !contract}
              onClick={handleConfirm}
            >
              {isSubmitting ? "Solicitando…" : "Solicitar Assinatura"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editEmailOpen} onOpenChange={setEditEmailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar e-mail do paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="contract-patient-email">E-mail</Label>
            <Input
              id="contract-patient-email"
              type="email"
              value={emailInput}
              onChange={(event) => setEmailInput(event.target.value)}
              placeholder="paciente@email.com"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditEmailOpen(false)}
              disabled={savingEmail}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={savingEmail}
              onClick={() => void handleSaveEmail()}
            >
              {savingEmail ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
