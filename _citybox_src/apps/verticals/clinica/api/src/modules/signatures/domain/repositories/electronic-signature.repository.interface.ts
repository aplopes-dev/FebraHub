import type { ElectronicSignature } from '../entities/electronic-signature.entity';
import type {
  ElectronicSignatureKind,
  ElectronicSignatureStatus,
} from '../entities/electronic-signature.entity';

export type ElectronicSignatureReportCriteria = {
  startDate: string;
  endDate: string;
  kinds?: ElectronicSignatureKind[];
  /** Filtro da listagem. Se omitido, lista `pending` + `signed`. */
  statuses?: ElectronicSignatureStatus[];
  skip: number;
  take: number;
};

export type ElectronicSignatureReportRow = {
  signature: ElectronicSignature;
  patientName: string;
};

export type ElectronicSignatureReportStats = {
  enviados: number;
  pendentes: number;
  assinados: number;
};

export type ElectronicSignatureReportResult = {
  items: ElectronicSignatureReportRow[];
  total: number;
  stats: ElectronicSignatureReportStats;
};

export type ElectronicSignaturePatientListCriteria = {
  status: ElectronicSignatureStatus;
  skip: number;
  take: number;
};

export type ElectronicSignaturePatientListResult = {
  items: ElectronicSignature[];
  total: number;
};

export abstract class ElectronicSignatureRepository {
  abstract findById(
    storeId: string,
    id: string,
  ): Promise<ElectronicSignature | null>;

  abstract findByZapsignToken(
    zapsignDocumentToken: string,
  ): Promise<ElectronicSignature | null>;

  abstract findPendingByTarget(
    storeId: string,
    kind: ElectronicSignatureKind,
    targetId: string,
  ): Promise<ElectronicSignature | null>;

  abstract findLatestByTarget(
    storeId: string,
    kind: ElectronicSignatureKind,
    targetId: string,
  ): Promise<ElectronicSignature | null>;

  abstract findPendingOverlappingTargets(
    storeId: string,
    patientId: string,
    targetIds: string[],
  ): Promise<ElectronicSignature | null>;

  /** Relatório Loja: listagem paginada + KPIs do período (stats ignoram `statuses`). */
  abstract findManyForReport(
    storeId: string,
    criteria: ElectronicSignatureReportCriteria,
  ): Promise<ElectronicSignatureReportResult>;

  /** Lista assinaturas de um paciente (ficha), ordenadas por `requestedAt` desc. */
  abstract findManyByPatient(
    storeId: string,
    patientId: string,
    criteria: ElectronicSignaturePatientListCriteria,
  ): Promise<ElectronicSignaturePatientListResult>;

  abstract save(
    signature: ElectronicSignature,
  ): Promise<ElectronicSignature>;
}
