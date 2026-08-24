import { Badge } from '@citybox/ui/atoms';
import type { ContractSignatureStatus, PatientContractEmissionRecord } from '../../../../types/patient-contract-emission';

type ContractSignatureBadgeProps = {
  responsibleStatus: ContractSignatureStatus;
  patientStatus: ContractSignatureStatus;
};

export function ContractSignatureBadge({
  responsibleStatus,
  patientStatus,
}: ContractSignatureBadgeProps) {
  const isFullySigned = responsibleStatus === 'signed' && patientStatus === 'signed';
  const isPending =
    responsibleStatus === 'pending' ||
    patientStatus === 'pending' ||
    (responsibleStatus === 'signed' && patientStatus === 'unsigned') ||
    (patientStatus === 'signed' && responsibleStatus === 'unsigned');

  return (
    <Badge
      variant={isFullySigned ? 'secondary' : 'outline'}
      className="shrink-0 text-xs font-normal"
    >
      {isFullySigned ? 'Com assinatura' : isPending ? 'Assinatura pendente' : 'Sem assinatura'}
    </Badge>
  );
}

export function PatientContractSignatureBadge({
  contract,
}: {
  contract: Pick<
    PatientContractEmissionRecord,
    'responsibleSignatureStatus' | 'patientSignatureStatus'
  >;
}) {
  return (
    <ContractSignatureBadge
      responsibleStatus={contract.responsibleSignatureStatus}
      patientStatus={contract.patientSignatureStatus}
    />
  );
}
