import { Badge, Card, CardContent, CardHeader, CardTitle } from "@citybox/ui/atoms";
import type { LojaDetail } from "../../../types";

const CLINIC_STRAND_LABELS: Record<string, string> = {
  odontologia: "Odontologia",
  fisioterapia: "Fisioterapia",
  nutricao: "Nutrição",
};

interface FiscalTabProps {
  detail: LojaDetail;
}

function FiscalField({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value}</dd>
    </div>
  );
}

export function FiscalTab({ detail }: FiscalTabProps) {
  const isPf = detail.personType === "PF";
  const address = detail.address;
  const fullAddress = address
    ? [
        address.street,
        address.number,
        address.complement,
        address.neighborhood,
        address.city && address.state ? `${address.city} - ${address.state}` : undefined,
        address.zipCode ? `CEP ${address.zipCode}` : undefined,
      ]
        .filter(Boolean)
        .join(", ")
    : undefined;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Fiscais</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.personType && (
            <Badge variant="secondary" className="mb-4">
              {isPf ? "Pessoa física" : "Pessoa jurídica"}
            </Badge>
          )}
          <dl className="grid gap-4 sm:grid-cols-2">
            {detail.vertical === "Clínica" && detail.clinicStrand ? (
              <FiscalField
                label="Vertente da clínica"
                value={CLINIC_STRAND_LABELS[detail.clinicStrand] ?? detail.clinicStrand}
              />
            ) : null}
            <FiscalField label={isPf ? "CPF" : "CNPJ"} value={detail.document} />
            {!isPf && <FiscalField label="Razão Social" value={detail.legalName} />}
            {!isPf && (
              <FiscalField label="Inscrição Estadual" value={detail.stateRegistration} />
            )}
            <FiscalField label="Responsável" value={detail.responsibleName} />
            <FiscalField label="E-mail de Cobrança" value={detail.billingEmail} />
            <FiscalField label="Telefone" value={detail.phone} />
            {fullAddress && (
              <div className="space-y-1 sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">Endereço</dt>
                <dd className="text-sm">{fullAddress}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
