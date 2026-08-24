import type { ElectronicSignatureReportItem } from '../services/electronic-signatures-report.api.service';
import type {
  AssinaturaRelatorioRow,
  AssinaturaRelatorioRowTipo,
} from '../data/assinatura-relatorio';

const KIND_TO_TIPO: Record<
  ElectronicSignatureReportItem['kind'],
  AssinaturaRelatorioRowTipo
> = {
  anamnesis: 'anamnese',
  evolution_batch: 'evolucao',
  contract: 'contrato',
};

function resolveSignUrl(item: ElectronicSignatureReportItem): string | null {
  const pending = item.signers.find(
    (signer) => signer.status !== 'signed' && signer.signUrl,
  );
  if (pending?.signUrl) return pending.signUrl;
  const any = item.signers.find((signer) => signer.signUrl);
  return any?.signUrl ?? null;
}

/** Mapeia item da API para linha da tabela do relatório. */
export function toAssinaturaRelatorioRow(
  item: ElectronicSignatureReportItem,
): AssinaturaRelatorioRow {
  const signedCount = item.signers.filter(
    (signer) => signer.status === 'signed',
  ).length;
  const total = item.signers.length;

  return {
    id: item.id,
    issuedAt: item.requestedAt.slice(0, 10),
    tipo: KIND_TO_TIPO[item.kind],
    assinaturas: `${signedCount}/${total || 1}`,
    pacienteNome: item.patientName,
    profissionalNome: item.requestedByName,
    signUrl: item.status === 'pending' ? resolveSignUrl(item) : null,
    status: item.status === 'signed' ? 'signed' : 'pending',
    patientId: item.patientId,
    signature: item,
  };
}
