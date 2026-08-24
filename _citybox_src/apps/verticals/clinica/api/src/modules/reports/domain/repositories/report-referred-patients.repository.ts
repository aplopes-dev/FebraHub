import type {
  ListReportReferredPatientsCriteria,
  ListReportReferredPatientsResult,
} from '../report-referred-patients.types';

export abstract class ReportReferredPatientsRepository {
  abstract findMany(
    storeId: string,
    criteria: ListReportReferredPatientsCriteria,
  ): Promise<ListReportReferredPatientsResult>;
}
