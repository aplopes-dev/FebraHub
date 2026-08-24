import type { ElectronicSignatureReportItem } from '../services/electronic-signatures-report.api.service';

export type AssinaturaRelatorioRowStatus = 'signed' | 'pending';

export type AssinaturaRelatorioRowTipo = 'anamnese' | 'evolucao' | 'contrato';

export type AssinaturaRelatorioRow = {
  id: string;
  /** Data de emissão/envio (yyyy-MM-dd). */
  issuedAt: string;
  tipo: AssinaturaRelatorioRowTipo;
  /** Ex.: "1/1" ou "0/2". */
  assinaturas: string;
  /** Nome do paciente/responsável exibido na coluna Assinaturas. */
  pacienteNome: string;
  /** Nome do profissional que solicitou a assinatura. */
  profissionalNome: string;
  /** Link ZapSign para compartilhar (só pendentes). */
  signUrl: string | null;
  status: AssinaturaRelatorioRowStatus;
  patientId: string;
  /** Payload completo da API (compartilhar link / ações). */
  signature: ElectronicSignatureReportItem;
};

export const ASSINATURA_RELATORIO_TIPO_LABEL: Record<
  AssinaturaRelatorioRowTipo,
  string
> = {
  anamnese: 'Anamnese',
  evolucao: 'Evolução',
  contrato: 'Contrato',
};

export const ASSINATURA_RELATORIO_STATUS_LABEL: Record<
  AssinaturaRelatorioRowStatus,
  string
> = {
  signed: 'Assinado',
  pending: 'Pendente',
};

export const DOCUMENT_TIPO_TO_KIND = {
  anamnese: 'anamnesis',
  evolucao: 'evolution_batch',
  contrato: 'contract',
} as const;

export const EMPTY_ASSINATURA_RELATORIO_STATS = {
  enviados: 0,
  pendentes: 0,
  assinados: 0,
} as const;
