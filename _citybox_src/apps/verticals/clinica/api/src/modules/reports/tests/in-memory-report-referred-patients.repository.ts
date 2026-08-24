import { ReportReferredPatientsRepository } from '../domain/repositories/report-referred-patients.repository';
import {
  REPORT_REFERRED_BY_UNINFORMED,
  type ListReportReferredPatientsCriteria,
  type ListReportReferredPatientsResult,
  type ReportReferredPatientRow,
} from '../domain/report-referred-patients.types';

type StoredPatient = {
  id: string;
  storeId: string;
  systemKey: 'indicacao' | 'indicacao_profissional' | 'indicacao_profissional_externo' | 'google' | 'instagram' | 'facebook' | 'outro' | null;
  name: string;
  createdAt: string;
  firstAppointmentDate: string | null;
  approvedBudgetsCount: number;
  referredBy?: string | null;
};

export class InMemoryReportReferredPatientsRepository extends ReportReferredPatientsRepository {
  private readonly patients: StoredPatient[] = [];

  seed(patients: readonly StoredPatient[]): void {
    this.patients.splice(0, this.patients.length, ...patients);
  }

  async findMany(
    storeId: string,
    criteria: ListReportReferredPatientsCriteria,
  ): Promise<ListReportReferredPatientsResult> {
    const matched = this.patients
      .filter((item) => item.storeId === storeId)
      .filter(
        (item) =>
          item.systemKey === 'indicacao' ||
          item.systemKey === 'indicacao_profissional' ||
          item.systemKey === 'indicacao_profissional_externo',
      )
      .filter((item) => {
        const day = item.createdAt.slice(0, 10);
        return day >= criteria.startDate && day <= criteria.endDate;
      })
      .map(
        (item): ReportReferredPatientRow => ({
          id: item.id,
          referredPatientName: item.name,
          referredBy: item.referredBy?.trim() || REPORT_REFERRED_BY_UNINFORMED,
          referralDate: item.createdAt.slice(0, 10),
          firstAppointmentDate: item.firstAppointmentDate,
          approvedBudgetsCount: item.approvedBudgetsCount,
        }),
      )
      .sort((a, b) => {
        if (a.referralDate !== b.referralDate) {
          return b.referralDate.localeCompare(a.referralDate);
        }
        return b.id.localeCompare(a.id);
      });

    const total = matched.length;
    const pageItems = matched.slice(
      criteria.skip,
      criteria.skip + criteria.take,
    );
    return { items: pageItems, total };
  }
}
