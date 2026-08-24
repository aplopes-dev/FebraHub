import { ReportBirthdaysRepository } from '../domain/repositories/report-birthdays.repository';
import type {
  ListReportBirthdaysCriteria,
  ListReportBirthdaysResult,
  ReportBirthdayRow,
} from '../domain/report-birthday.types';
import {
  birthdayOccurrenceInRange,
  isBirthdayInCivilDateRange,
} from '../domain/utils/birthday-civil-range';

type StoredPatient = {
  id: string;
  storeId: string;
  status: 'active' | 'inactive';
  patientName: string;
  phone: string;
  mobile: string;
  birthDate: string | null;
};

export class InMemoryReportBirthdaysRepository extends ReportBirthdaysRepository {
  private readonly patients: StoredPatient[] = [];

  seed(patients: readonly StoredPatient[]): void {
    this.patients.splice(0, this.patients.length, ...patients);
  }

  async findMany(
    storeId: string,
    criteria: ListReportBirthdaysCriteria,
  ): Promise<ListReportBirthdaysResult> {
    const range = {
      startDate: criteria.startDate,
      endDate: criteria.endDate,
    };

    const matched = this.patients
      .filter((patient) => patient.storeId === storeId)
      .filter((patient) => patient.status === criteria.status)
      .filter((patient) => Boolean(patient.birthDate?.trim()))
      .filter((patient) =>
        isBirthdayInCivilDateRange(patient.birthDate!, range),
      )
      .map((patient) => {
        const occurrence = birthdayOccurrenceInRange(patient.birthDate!, range);
        const row: ReportBirthdayRow & { occurrenceMs: number } = {
          id: patient.id,
          patientName: patient.patientName,
          phone: patient.phone,
          birthDate: patient.birthDate!,
          mobile: patient.mobile,
          occurrenceMs: occurrence?.getTime() ?? Number.MAX_SAFE_INTEGER,
        };
        return row;
      })
      .sort((a, b) => {
        if (a.occurrenceMs !== b.occurrenceMs) {
          return a.occurrenceMs - b.occurrenceMs;
        }
        return a.patientName.localeCompare(b.patientName, 'pt-BR');
      });

    const total = matched.length;
    const items = matched
      .slice(criteria.skip, criteria.skip + criteria.take)
      .map(({ occurrenceMs: _occurrenceMs, ...row }) => row);

    return { items, total };
  }
}
