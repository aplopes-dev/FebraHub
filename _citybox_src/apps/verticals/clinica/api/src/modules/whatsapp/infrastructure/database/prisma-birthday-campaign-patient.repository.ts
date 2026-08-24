import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import type {
  BirthdayCampaignPatient,
  BirthdayCampaignPatientFilters,
} from '../../domain/repositories/birthday-campaign-patient.repository.interface';
import { BirthdayCampaignPatientRepository } from '../../domain/repositories/birthday-campaign-patient.repository.interface';

type RawRow = {
  id: string;
  name: string;
  phone: string;
  guardian_phone: string;
};

@Injectable()
export class PrismaBirthdayCampaignPatientRepository extends BirthdayCampaignPatientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findBirthdayPatients(
    storeId: string,
    civilYmd: string,
    filters: BirthdayCampaignPatientFilters,
  ): Promise<BirthdayCampaignPatient[]> {
    const planFilter =
      filters.planIds.length > 0
        ? Prisma.sql`AND p.plan_id IN (${Prisma.join(filters.planIds)})`
        : Prisma.empty;

    const genderFilter =
      filters.genders.length > 0
        ? Prisma.sql`AND p.gender::text IN (${Prisma.join(filters.genders)})`
        : Prisma.empty;

    const specialtyFilter =
      filters.specialtyIds.length > 0
        ? Prisma.sql`
          AND (
            EXISTS (
              SELECT 1
              FROM clinica.patient_treatments pt
              INNER JOIN clinica.clinic_plan_treatments cpt
                ON cpt.id = pt.treatment_id
              WHERE pt.patient_id = p.id
                AND pt.store_id = p.store_id
                AND cpt.specialty_id IN (${Prisma.join(filters.specialtyIds)})
            )
            OR EXISTS (
              SELECT 1
              FROM clinica.budgets b
              INNER JOIN clinica.budget_items bi ON bi.budget_id = b.id
              INNER JOIN clinica.clinic_plan_treatments cpt
                ON cpt.id = bi.treatment_id
              WHERE b.patient_id = p.id
                AND b.store_id = p.store_id
                AND b.status = 'approved'
                AND cpt.specialty_id IN (${Prisma.join(filters.specialtyIds)})
            )
          )
        `
        : Prisma.empty;

    const rows = await this.prisma.$queryRaw<RawRow[]>`
      SELECT
        p.id,
        p.name,
        p.phone,
        p.guardian_phone
      FROM clinica.patients p
      WHERE p.store_id = ${storeId}
        AND p.status = 'active'
        AND p.birth_date IS NOT NULL
        AND EXTRACT(MONTH FROM p.birth_date) = EXTRACT(MONTH FROM ${civilYmd}::date)
        AND EXTRACT(DAY FROM p.birth_date) = EXTRACT(DAY FROM ${civilYmd}::date)
        ${planFilter}
        ${genderFilter}
        ${specialtyFilter}
      ORDER BY p.name ASC
    `;

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone ?? '',
      guardianPhone: row.guardian_phone ?? '',
    }));
  }
}
