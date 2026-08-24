import { Appointment } from '../../scheduling/appointments/domain/entities/appointment.entity';
import type { AppointmentStatus } from '../../scheduling/shared/domain/appointment-types';
import { FinancialEntry } from '../../financial/entries/domain/entities/financial-entry.entity';
import { toIsoDateOnly } from '../../financial/entries/application/utils/financial-entry.utils';
import { Patient } from '../../patients/domain/entities/patient.entity';
import { PatientTreatment } from '../../patients/patient-treatments/domain/entities/patient-treatment.entity';
import {
  OPEN_APPOINTMENT_STATUSES,
  resolveCurrentMonthRange,
  resolveLastMonthsRange,
} from '../application/utils/dashboard-patients.dates';
import { matchesDashboardPatientSearch } from '../application/utils/dashboard-patient-search';
import {
  DashboardPatientsQuery,
  type DashboardPatientListItem,
  type DashboardPatientsListCriteria,
  type DashboardPatientsListResult,
  type DashboardPatientsSummary,
} from '../application/utils/dashboard-patients.types';

/**
 * In-memory query for dashboard patient metrics (unit tests).
 */
export class InMemoryDashboardPatientsQuery extends DashboardPatientsQuery {
  private patients = new Map<string, Patient>();
  private appointments: Appointment[] = [];
  private entries: FinancialEntry[] = [];
  private treatments: PatientTreatment[] = [];

  seedPatient(patient: Patient): void {
    this.patients.set(patient.id, patient);
  }

  seedAppointment(appointment: Appointment): void {
    this.appointments = [...this.appointments, appointment];
  }

  seedEntry(entry: FinancialEntry): void {
    this.entries = [...this.entries, entry];
  }

  seedTreatment(treatment: PatientTreatment): void {
    this.treatments = [...this.treatments, treatment];
  }

  async getSummary(
    storeId: string,
    now: Date,
  ): Promise<DashboardPatientsSummary> {
    return {
      totalRegisteredCount: this.activePatients(storeId).length,
      seenLast6MonthsCount: this.seenLast6MonthsIds(storeId, now).size,
      overdueDebtsPatientsCount: this.overdueDebtsMap(storeId, now).size,
      newSeenThisMonthCount: this.newSeenThisMonthIds(storeId, now).size,
      openTreatmentWithoutAppointmentCount:
        this.openTreatmentWithoutAppointmentIds(storeId, now).size,
    };
  }

  async listByMetric(
    storeId: string,
    criteria: DashboardPatientsListCriteria,
  ): Promise<DashboardPatientsListResult> {
    let items: DashboardPatientListItem[];

    switch (criteria.metric) {
      case 'total_registered':
        items = this.activePatients(storeId).map((p) => this.toItem(p));
        break;
      case 'seen_last_6_months':
        items = this.patientsByIds(
          storeId,
          this.seenLast6MonthsIds(storeId, criteria.now),
        );
        break;
      case 'overdue_debts': {
        const overdue = this.overdueDebtsMap(storeId, criteria.now);
        items = this.patientsByIds(storeId, new Set(overdue.keys())).map(
          (item) => ({
            ...item,
            valueCents: overdue.get(item.id) ?? 0,
          }),
        );
        break;
      }
      case 'new_seen_this_month':
        items = this.patientsByIds(
          storeId,
          this.newSeenThisMonthIds(storeId, criteria.now),
        );
        break;
      case 'open_treatment_without_appointment':
        items = this.patientsByIds(
          storeId,
          this.openTreatmentWithoutAppointmentIds(storeId, criteria.now),
        );
        break;
      default: {
        const _exhaustive: never = criteria.metric;
        return _exhaustive;
      }
    }

    const search = criteria.search?.trim();
    const filtered = search
      ? items.filter((item) => {
          const patient = this.patients.get(item.id);
          if (!patient) return false;
          return matchesDashboardPatientSearch(
            {
              name: patient.name,
              email: patient.email,
              cpf: patient.cpf,
              phone: patient.phone,
              landlinePhone: patient.landlinePhone,
            },
            search,
          );
        })
      : items;

    const sorted = [...filtered].sort((a, b) =>
      a.name.localeCompare(b.name, 'pt-BR'),
    );

    return {
      total: sorted.length,
      items: sorted.slice(criteria.skip, criteria.skip + criteria.take),
    };
  }

  private activePatients(storeId: string): Patient[] {
    return [...this.patients.values()].filter(
      (patient) =>
        patient.storeId === storeId && patient.status === 'active',
    );
  }

  private toItem(patient: Patient, valueCents?: number): DashboardPatientListItem {
    return {
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
      landlinePhone: patient.landlinePhone,
      email: patient.email,
      cpf: patient.cpf,
      ...(valueCents !== undefined ? { valueCents } : {}),
    };
  }

  private patientsByIds(
    storeId: string,
    ids: Set<string>,
  ): DashboardPatientListItem[] {
    return [...ids]
      .map((id) => this.patients.get(id))
      .filter(
        (patient): patient is Patient =>
          Boolean(patient) && patient!.storeId === storeId,
      )
      .map((patient) => this.toItem(patient));
  }

  private seenLast6MonthsIds(storeId: string, now: Date): Set<string> {
    const { startAt, endAt } = resolveLastMonthsRange(now, 6);
    const ids = new Set<string>();
    for (const appointment of this.appointments) {
      if (appointment.storeId !== storeId) continue;
      if (appointment.status !== 'finished') continue;
      if (appointment.startAt < startAt || appointment.startAt > endAt) {
        continue;
      }
      ids.add(appointment.patientId);
    }
    return ids;
  }

  private overdueDebtsMap(storeId: string, now: Date): Map<string, number> {
    const todayIso = toIsoDateOnly(now);
    const map = new Map<string, number>();
    for (const entry of this.entries) {
      if (entry.storeId !== storeId) continue;
      if (entry.type !== 'income' || entry.status !== 'pending') continue;
      if (!entry.patientId) continue;
      if (toIsoDateOnly(entry.dueDate) >= todayIso) continue;
      map.set(
        entry.patientId,
        (map.get(entry.patientId) ?? 0) + entry.valueCents,
      );
    }
    return map;
  }

  private newSeenThisMonthIds(storeId: string, now: Date): Set<string> {
    const { startAt, endAt } = resolveCurrentMonthRange(now);
    const firstFinished = new Map<string, Date>();
    for (const appointment of this.appointments) {
      if (appointment.storeId !== storeId) continue;
      if (appointment.status !== 'finished') continue;
      const current = firstFinished.get(appointment.patientId);
      if (!current || appointment.startAt < current) {
        firstFinished.set(appointment.patientId, appointment.startAt);
      }
    }
    const ids = new Set<string>();
    for (const [patientId, firstAt] of firstFinished) {
      if (firstAt >= startAt && firstAt <= endAt) {
        ids.add(patientId);
      }
    }
    return ids;
  }

  private openTreatmentWithoutAppointmentIds(
    storeId: string,
    now: Date,
  ): Set<string> {
    const openStatuses = new Set<AppointmentStatus>(OPEN_APPOINTMENT_STATUSES);
    const patientsWithOpenFuture = new Set<string>();
    for (const appointment of this.appointments) {
      if (appointment.storeId !== storeId) continue;
      if (!openStatuses.has(appointment.status)) continue;
      if (appointment.startAt < now) continue;
      patientsWithOpenFuture.add(appointment.patientId);
    }

    const ids = new Set<string>();
    for (const treatment of this.treatments) {
      if (treatment.storeId !== storeId) continue;
      if (treatment.status !== 'active') continue;
      if (patientsWithOpenFuture.has(treatment.patientId)) continue;
      ids.add(treatment.patientId);
    }
    return ids;
  }
}
