import { ReportOpenTreatmentsRepository } from '../domain/repositories/report-open-treatments.repository';
import type {
  ListReportOpenTreatmentsCriteria,
  ListReportOpenTreatmentsResult,
  ReportOpenTreatmentsWithoutAppointmentRow,
} from '../domain/report-open-treatments.types';

const LIVE_APPOINTMENT_STATUSES = [
  'scheduled',
  'confirmed',
  'patient_waiting',
  'in_progress',
] as const;

type StoredAppointment = {
  status: (typeof LIVE_APPOINTMENT_STATUSES)[number] | string;
  startAt: Date;
};

type StoredPatient = {
  id: string;
  storeId: string;
  status: 'active' | 'inactive';
  patientName: string;
  phone: string;
  mobile: string;
  document: string;
  hasActiveTreatment: boolean;
  appointments: StoredAppointment[];
};

function hasLiveAppointment(
  appointments: readonly StoredAppointment[],
  now: Date,
): boolean {
  return appointments.some((appointment) => {
    if (
      !LIVE_APPOINTMENT_STATUSES.includes(
        appointment.status as (typeof LIVE_APPOINTMENT_STATUSES)[number],
      )
    ) {
      return false;
    }
    return (
      appointment.startAt.getTime() >= now.getTime() ||
      appointment.status === 'in_progress'
    );
  });
}

export class InMemoryReportOpenTreatmentsRepository extends ReportOpenTreatmentsRepository {
  private readonly patients: StoredPatient[] = [];

  seed(patients: readonly StoredPatient[]): void {
    this.patients.splice(0, this.patients.length, ...patients);
  }

  async findMany(
    storeId: string,
    criteria: ListReportOpenTreatmentsCriteria,
  ): Promise<ListReportOpenTreatmentsResult> {
    const matched = this.patients
      .filter((patient) => patient.storeId === storeId)
      .filter((patient) => patient.status === criteria.status)
      .filter((patient) => patient.hasActiveTreatment)
      .filter((patient) => !hasLiveAppointment(patient.appointments, criteria.now))
      .map(
        (patient): ReportOpenTreatmentsWithoutAppointmentRow => ({
          id: patient.id,
          patientName: patient.patientName,
          phone: patient.phone,
          mobile: patient.mobile,
          document: patient.document,
        }),
      )
      .sort((a, b) => a.patientName.localeCompare(b.patientName, 'pt-BR'));

    const total = matched.length;
    const items = matched.slice(criteria.skip, criteria.skip + criteria.take);
    return { items, total };
  }
}
