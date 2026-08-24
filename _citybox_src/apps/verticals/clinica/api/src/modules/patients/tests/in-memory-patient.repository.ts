import {
  PatientRepository,
  type BirthdayPatient,
  type PatientAcquisitionListItem,
  type PatientDemographicsListItem,
  type PatientDetail,
  type PatientListCriteria,
} from '../domain/repositories/patient.repository.interface';
import { Patient, type PatientProps } from '../domain/entities/patient.entity';
import type { PatientReferralOriginSystemKey } from '../patient-referral-origins/domain/entities/patient-referral-origin.entity';
import { countUpcomingBirthdays } from '../domain/utils/birthday-window.utils';
import { matchesPatientSearch } from '../domain/utils/patient-search.utils';
import { toIsoDateOnly } from '../../financial/entries/application/utils/financial-entry.utils';

type CategoryMeta = {
  name: string;
  colorId: string;
};

type PlanMeta = {
  name: string;
  status?: 'active' | 'inactive';
};

type ReferralOriginMeta = {
  name: string;
  systemKey: PatientReferralOriginSystemKey | null;
};

type ExternalProfessionalMeta = {
  name: string;
};

export class InMemoryPatientRepository extends PatientRepository {
  private patients = new Map<string, Patient>();
  private categories = new Map<string, CategoryMeta>();
  private plans = new Map<string, PlanMeta>();
  private referralOrigins = new Map<string, ReferralOriginMeta>();
  private externalProfessionals = new Map<string, ExternalProfessionalMeta>();

  seedCategory(categoryId: string, meta: CategoryMeta): void {
    this.categories.set(categoryId, meta);
  }

  seedPlan(planId: string, meta: PlanMeta): void {
    this.plans.set(planId, meta);
  }

  seedReferralOrigin(originId: string, meta: ReferralOriginMeta): void {
    this.referralOrigins.set(originId, meta);
  }

  seedExternalProfessional(
    professionalId: string,
    meta: ExternalProfessionalMeta,
  ): void {
    this.externalProfessionals.set(professionalId, meta);
  }

  seedPatient(patient: Patient): void {
    this.patients.set(patient.id, patient);
  }

  async findById(storeId: string, id: string): Promise<PatientDetail | null> {
    const patient = this.patients.get(id);
    if (!patient || patient.storeId !== storeId) return null;
    return this.toDetail(patient);
  }

  async findByCpf(
    storeId: string,
    cpf: string,
    excludeId?: string,
  ): Promise<Patient | null> {
    for (const patient of this.patients.values()) {
      if (
        patient.storeId === storeId &&
        patient.cpf === cpf &&
        patient.id !== excludeId
      ) {
        return patient;
      }
    }
    return null;
  }

  async findMany(
    storeId: string,
    criteria: PatientListCriteria,
  ): Promise<PatientDetail[]> {
    const filtered = [...this.patients.values()]
      .filter((patient) => patient.storeId === storeId)
      .filter((patient) => this.matchesFilters(patient, criteria))
      .sort((a, b) => this.comparePatients(a, b, criteria));

    return filtered
      .slice(criteria.skip, criteria.skip + criteria.take)
      .map((patient) => this.toDetail(patient));
  }

  async count(storeId: string, criteria: PatientListCriteria): Promise<number> {
    return [...this.patients.values()].filter(
      (patient) =>
        patient.storeId === storeId && this.matchesFilters(patient, criteria),
    ).length;
  }

  async countUpcomingBirthdays(
    storeId: string,
    todayIsoDate: string,
    withinDays = 30,
  ): Promise<number> {
    const birthDates = [...this.patients.values()]
      .filter(
        (patient) =>
          patient.storeId === storeId &&
          patient.status === 'active' &&
          patient.birthDate !== null,
      )
      .map((patient) => patient.birthDate as Date);

    return countUpcomingBirthdays(birthDates, todayIsoDate, withinDays);
  }

  async findActiveWithBirthDate(
    storeId: string,
    search?: string,
  ): Promise<BirthdayPatient[]> {
    const trimmedSearch = search?.trim();

    return [...this.patients.values()]
      .filter(
        (patient) =>
          patient.storeId === storeId &&
          patient.status === 'active' &&
          patient.birthDate !== null &&
          (!trimmedSearch || matchesPatientSearch(patient, trimmedSearch)),
      )
      .map((patient) => ({
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
        birthDate: patient.birthDate as Date,
        photoObjectKey: patient.photoObjectKey,
      }));
  }

  async listPatientsForAcquisitionInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<PatientAcquisitionListItem[]> {
    return [...this.patients.values()]
      .filter(
        (patient) =>
          patient.storeId === storeId &&
          patient.createdAt >= range.startAt &&
          patient.createdAt <= range.endAt,
      )
      .map((patient) => {
        const origin = patient.referralOriginId
          ? this.referralOrigins.get(patient.referralOriginId)
          : undefined;
        return {
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          email: patient.email,
          cpf: patient.cpf,
          createdAt: patient.createdAt,
          referralOriginSystemKey: origin?.systemKey ?? null,
          referralOriginName: origin?.name ?? null,
        };
      });
  }

  async listAcquisitionYears(storeId: string): Promise<number[]> {
    const years = new Set<number>();
    for (const patient of this.patients.values()) {
      if (patient.storeId !== storeId) continue;
      years.add(Number(toIsoDateOnly(patient.createdAt).slice(0, 4)));
    }
    return [...years].sort((a, b) => b - a);
  }

  async listPatientsForDemographics(
    storeId: string,
  ): Promise<PatientDemographicsListItem[]> {
    return [...this.patients.values()]
      .filter(
        (patient) =>
          patient.storeId === storeId && patient.status === 'active',
      )
      .map((patient) => ({
        birthDate: patient.birthDate,
        gender: patient.gender,
      }));
  }

  async save(patient: Patient): Promise<Patient> {
    this.patients.set(patient.id, patient);
    return patient;
  }

  seed(props: PatientProps, id?: string): Patient {
    const patient = Patient.create(props, id);
    this.patients.set(patient.id, patient);
    return patient;
  }

  private toDetail(patient: Patient): PatientDetail {
    const category = this.categories.get(patient.categoryId);
    const plan = patient.planId ? this.plans.get(patient.planId) : undefined;
    const origin = patient.referralOriginId
      ? this.referralOrigins.get(patient.referralOriginId)
      : undefined;
    const referredByPatient = patient.referredByPatientId
      ? this.patients.get(patient.referredByPatientId)
      : undefined;
    const referredByExternalProfessional =
      patient.referredByExternalProfessionalId
        ? this.externalProfessionals.get(
            patient.referredByExternalProfessionalId,
          )
        : undefined;

    return {
      patient,
      categoryName: category?.name ?? 'Sem categoria',
      categoryColorId: category?.colorId ?? '#3b82f6',
      planName: plan?.name ?? null,
      planStatus: plan ? (plan.status ?? 'active') : null,
      referralOriginName: origin?.name ?? null,
      referralOriginSystemKey: origin?.systemKey ?? null,
      referredByPatientName: referredByPatient?.name ?? null,
      referredByExternalProfessionalName:
        referredByExternalProfessional?.name ?? null,
    };
  }

  private matchesFilters(
    patient: Patient,
    criteria: PatientListCriteria,
  ): boolean {
    if (criteria.categoryId && patient.categoryId !== criteria.categoryId) {
      return false;
    }
    if (criteria.status && patient.status !== criteria.status) {
      return false;
    }
    if (!criteria.search) return true;

    return matchesPatientSearch(
      {
        name: patient.name,
        cpf: patient.cpf,
        phone: patient.phone,
        landlinePhone: patient.landlinePhone,
      },
      criteria.search,
    );
  }

  private comparePatients(
    a: Patient,
    b: Patient,
    criteria: PatientListCriteria,
  ): number {
    const order = criteria.sortOrder === 'desc' ? -1 : 1;
    const sortBy = criteria.sortBy ?? 'name';

    switch (sortBy) {
      case 'birthDate': {
        const aTime = a.birthDate?.getTime() ?? 0;
        const bTime = b.birthDate?.getTime() ?? 0;
        return (aTime - bTime) * order;
      }
      case 'status':
        return a.status.localeCompare(b.status) * order;
      case 'planName': {
        const aPlan = a.planId ? (this.plans.get(a.planId)?.name ?? '') : '';
        const bPlan = b.planId ? (this.plans.get(b.planId)?.name ?? '') : '';
        return aPlan.localeCompare(bPlan) * order;
      }
      case 'category': {
        const aCat = this.categories.get(a.categoryId)?.name ?? '';
        const bCat = this.categories.get(b.categoryId)?.name ?? '';
        return aCat.localeCompare(bCat) * order;
      }
      case 'name':
      default:
        return a.name.localeCompare(b.name) * order;
    }
  }
}
