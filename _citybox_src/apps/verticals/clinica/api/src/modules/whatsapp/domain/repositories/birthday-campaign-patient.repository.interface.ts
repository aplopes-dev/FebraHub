import type { AniversarioGender } from '../../../marketing/campaigns/domain/content/aniversario.content';

export type BirthdayCampaignPatientFilters = {
  planIds: string[];
  specialtyIds: string[];
  genders: AniversarioGender[];
};

export type BirthdayCampaignPatient = {
  id: string;
  name: string;
  phone: string;
  guardianPhone: string;
};

export abstract class BirthdayCampaignPatientRepository {
  /**
   * Pacientes ativos com aniversário no dia civil `civilYmd` (yyyy-MM-dd),
   * opcionalmente filtrados por plano / especialidade / gênero.
   */
  abstract findBirthdayPatients(
    storeId: string,
    civilYmd: string,
    filters: BirthdayCampaignPatientFilters,
  ): Promise<BirthdayCampaignPatient[]>;
}
