"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
} from "@citybox/ui/atoms";
import {
  maskPatientCpf,
  normalizeDigits,
} from "@/features/clinic/modules/patients/lib/format-patient-contact";
import type { FinancialEntry } from "../types";

export const RECEITA_SAUDE_INFO_URL =
  "https://www.gov.br/receitafederal/acl_users/credentials_cookie_auth/require_login?came_from=https%3A//www.gov.br/receitafederal/pt-br/centrais-de-conteudo/publicacoes/manuais/orientacao-tributaria/receita-saude-2.1.pdf";

export type EmitReceiptRecipient = "patient" | "other";

export type EmitIncomeReceiptFormValues = {
  recipient: EmitReceiptRecipient;
  /** Nome do responsável (só usado quando recipient = other). */
  otherName: string;
  /** CPF usado no PDF como pagador: paciente ou responsável, conforme recipient. */
  cpf: string;
  /** CPF do paciente (sempre o do paciente da transação). */
  patientCpf: string;
  copies: number;
};

type EmitIncomeReceiptDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: FinancialEntry | null;
  onConfirm: (values: EmitIncomeReceiptFormValues) => void;
};

export function EmitIncomeReceiptDialog({
  open,
  onOpenChange,
  entry,
  onConfirm,
}: EmitIncomeReceiptDialogProps) {
  const [recipient, setRecipient] = useState<EmitReceiptRecipient>("patient");
  const [patientCpf, setPatientCpf] = useState("");
  const [otherName, setOtherName] = useState("");
  const [otherCpf, setOtherCpf] = useState("");
  const [copies, setCopies] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entry) return;
    setRecipient("patient");
    setPatientCpf(entry.patient?.cpf ? maskPatientCpf(entry.patient.cpf) : "");
    setOtherName("");
    setOtherCpf("");
    setCopies(1);
    setError(null);
  }, [open, entry]);

  const patientName = entry?.patient?.name ?? entry?.description ?? "Paciente";

  const handleConfirm = () => {
    if (!recipient) {
      setError("Selecione em nome de quem emitir o recibo.");
      return;
    }

    if (!Number.isFinite(copies) || copies < 1 || copies > 10) {
      setError("Informe a quantidade de vias (1 a 10).");
      return;
    }

    if (recipient === "patient") {
      const cpfDigits = normalizeDigits(patientCpf);
      if (cpfDigits.length !== 11) {
        setError("Informe um CPF válido com 11 dígitos.");
        return;
      }
      setError(null);
      onConfirm({
        recipient,
        otherName: "",
        cpf: cpfDigits,
        patientCpf: cpfDigits,
        copies,
      });
      return;
    }

    if (!otherName.trim()) {
      setError("Informe o nome do responsável pelo pagamento.");
      return;
    }
    const otherCpfDigits = normalizeDigits(otherCpf);
    if (otherCpfDigits.length !== 11) {
      setError("Informe o CPF do responsável pelo pagamento.");
      return;
    }

    const patientCpfDigits = normalizeDigits(patientCpf);
    if (patientCpfDigits.length !== 11) {
      setError("Informe o CPF do paciente.");
      return;
    }

    setError(null);
    onConfirm({
      recipient,
      otherName: otherName.trim(),
      cpf: otherCpfDigits,
      patientCpf: patientCpfDigits,
      copies,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90dvh,40rem)] w-full max-w-lg flex-col gap-4 overflow-hidden sm:max-w-lg">
        <DialogHeader className="shrink-0">
          <DialogTitle>Emitir recibo</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Emitir recibo em nome de
            </Label>
            <RadioGroup
              value={recipient}
              onValueChange={(value) => {
                setRecipient(value as EmitReceiptRecipient);
                setError(null);
              }}
              className="gap-3"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="patient" id="emit-receipt-patient" />
                <Label
                  htmlFor="emit-receipt-patient"
                  className="cursor-pointer font-normal"
                >
                  O Paciente
                  {entry?.patient?.name ? (
                    <span className="text-muted-foreground">
                      {" "}
                      ({patientName})
                    </span>
                  ) : null}
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="other" id="emit-receipt-other" />
                <Label
                  htmlFor="emit-receipt-other"
                  className="cursor-pointer font-normal"
                >
                  Outra Pessoa
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="emit-receipt-patient-cpf">CPF do paciente</Label>
              <Input
                id="emit-receipt-patient-cpf"
                value={patientCpf}
                onChange={(event) =>
                  setPatientCpf(maskPatientCpf(event.target.value))
                }
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="emit-receipt-copies">Quantidade de vias</Label>
              <Input
                id="emit-receipt-copies"
                type="number"
                min={1}
                max={10}
                value={copies}
                onChange={(event) =>
                  setCopies(Number(event.target.value) || 1)
                }
              />
            </div>
          </div>

          {recipient === "other" ? (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Dados do responsável pelo pagamento
              </Label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="emit-receipt-other-name">Nome</Label>
                  <Input
                    id="emit-receipt-other-name"
                    value={otherName}
                    onChange={(event) => setOtherName(event.target.value)}
                    placeholder="Nome completo"
                    required
                    aria-required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="emit-receipt-other-cpf">CPF</Label>
                  <Input
                    id="emit-receipt-other-cpf"
                    value={otherCpf}
                    onChange={(event) =>
                      setOtherCpf(maskPatientCpf(event.target.value))
                    }
                    placeholder="000.000.000-00"
                    inputMode="numeric"
                    required
                    aria-required
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <div className="space-y-2">
              <p>
                A emissão de recibos de procedimentos por pessoas físicas para fins
                de dedução fiscal deve ser realizada exclusivamente pelo
                aplicativo Receita Saúde. Portanto, o recibo a ser gerado tem
                caráter informativo e não pode ser utilizado como comprovante
                fiscal.
              </p>
              <a
                href={RECEITA_SAUDE_INFO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-amber-900 underline underline-offset-2 hover:text-amber-700"
              >
                Saiba mais
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button type="button" onClick={handleConfirm}>
            Emitir recibo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
