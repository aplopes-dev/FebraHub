/* eslint-disable @typescript-eslint/require-await */
import type {
  BirthdayCampaignPatient,
  BirthdayCampaignPatientFilters,
} from '../domain/repositories/birthday-campaign-patient.repository.interface';
import { BirthdayCampaignPatientRepository } from '../domain/repositories/birthday-campaign-patient.repository.interface';

export class InMemoryBirthdayCampaignPatientRepository extends BirthdayCampaignPatientRepository {
  private patients: Array<
    BirthdayCampaignPatient & {
      storeId: string;
      birthMonth: number;
      birthDay: number;
      planId: string | null;
      gender: string;
      specialtyIds: string[];
      status: string;
    }
  > = [];

  seed(
    patients: Array<
      BirthdayCampaignPatient & {
        storeId: string;
        birthMonth: number;
        birthDay: number;
        planId?: string | null;
        gender?: string;
        specialtyIds?: string[];
        status?: string;
      }
    >,
  ): void {
    this.patients = patients.map((p) => ({
      ...p,
      planId: p.planId ?? null,
      gender: p.gender ?? 'other',
      specialtyIds: p.specialtyIds ?? [],
      status: p.status ?? 'active',
    }));
  }

  async findBirthdayPatients(
    storeId: string,
    civilYmd: string,
    filters: BirthdayCampaignPatientFilters,
  ): Promise<BirthdayCampaignPatient[]> {
    const [, monthStr, dayStr] = civilYmd.split('-');
    const month = Number(monthStr);
    const day = Number(dayStr);

    return this.patients
      .filter((p) => {
        if (p.storeId !== storeId || p.status !== 'active') return false;
        if (p.birthMonth !== month || p.birthDay !== day) return false;
        if (filters.planIds.length > 0) {
          if (!p.planId || !filters.planIds.includes(p.planId)) return false;
        }
        if (filters.genders.length > 0) {
          if (!filters.genders.includes(p.gender as 'male' | 'female' | 'other')) {
            return false;
          }
        }
        if (filters.specialtyIds.length > 0) {
          const hit = filters.specialtyIds.some((id) =>
            p.specialtyIds.includes(id),
          );
          if (!hit) return false;
        }
        return true;
      })
      .map(({ id, name, phone, guardianPhone }) => ({
        id,
        name,
        phone,
        guardianPhone,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }
}
