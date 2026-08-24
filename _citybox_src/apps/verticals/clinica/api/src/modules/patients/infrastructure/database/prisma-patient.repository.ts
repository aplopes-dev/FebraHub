import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { buildPatientSearchWhere } from './patient-search.where';
import { PatientRepository } from '../../domain/repositories/patient.repository.interface';
import type {
  BirthdayPatient,
  PatientAcquisitionListItem,
  PatientDemographicsListItem,
  PatientDetail,
  PatientListCriteria,
} from '../../domain/repositories/patient.repository.interface';
import {
  Patient,
  type PatientProps,
  type PatientGender,
  type PatientStatus,
} from '../../domain/entities/patient.entity';
import type { PatientReferralOriginSystemKey } from '../../patient-referral-origins/domain/entities/patient-referral-origin.entity';
import { countUpcomingBirthdays } from '../../domain/utils/birthday-window.utils';

type PatientBaseRow = {
  id: string;
  storeId: string;
  status: PatientStatus;
  name: string;
  cpf: string | null;
  rg: string;
  birthDate: Date | null;
  gender: PatientGender;
  photoObjectKey: string | null;
  photoMimeType: string | null;
  phone: string;
  landlinePhone: string;
  email: string;
  socialNetwork: string;
  medicalRecordNumber: string;
  referralOriginId: string | null;
  referredByPatientId: string | null;
  referredByMemberId: string | null;
  referredByMemberName: string | null;
  referredByExternalProfessionalId: string | null;
  profession: string;
  categoryId: string;
  guardianName: string;
  guardianBirthDate: Date | null;
  guardianCpf: string | null;
  guardianPhone: string;
  guardianNotes: string;
  zipCode: string;
  street: string;
  streetNumber: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  planId: string | null;
  planNumber: string;
  planHolderName: string;
  planHolderCpf: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PatientDetailRow = PatientBaseRow & {
  category: { name: string; colorId: string };
  plan: { name: string; status: 'active' | 'inactive' } | null;
  referralOrigin: {
    systemKey: PatientReferralOriginSystemKey | null;
    name: string;
  } | null;
  referredByPatient: { id: string; name: string } | null;
  referredByExternalProfessional: { id: string; name: string } | null;
};

const patientDetailInclude = {
  category: { select: { name: true, colorId: true } },
  plan: { select: { name: true, status: true } },
  referralOrigin: { select: { systemKey: true, name: true } },
  referredByPatient: { select: { id: true, name: true } },
  referredByExternalProfessional: { select: { id: true, name: true } },
} as const;

@Injectable()
export class PrismaPatientRepository extends PatientRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(storeId: string, id: string): Promise<PatientDetail | null> {
    const row = await this.prisma.patient.findFirst({
      where: { id, storeId },
      include: patientDetailInclude,
    });
    return row ? this.toDetail(row) : null;
  }

  async findByCpf(
    storeId: string,
    cpf: string,
    excludeId?: string,
  ): Promise<Patient | null> {
    const row = await this.prisma.patient.findFirst({
      where: {
        storeId,
        cpf,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findMany(
    storeId: string,
    criteria: PatientListCriteria,
  ): Promise<PatientDetail[]> {
    const where = this.buildWhere(storeId, criteria);
    const orderBy = this.buildOrderBy(criteria);

    const rows = await this.prisma.patient.findMany({
      where,
      include: patientDetailInclude,
      orderBy,
      skip: criteria.skip,
      take: criteria.take,
    });

    return rows.map((row) => this.toDetail(row));
  }

  async count(storeId: string, criteria: PatientListCriteria): Promise<number> {
    return this.prisma.patient.count({
      where: this.buildWhere(storeId, criteria),
    });
  }

  async countUpcomingBirthdays(
    storeId: string,
    todayIsoDate: string,
    withinDays = 30,
  ): Promise<number> {
    const rows = await this.prisma.patient.findMany({
      where: {
        storeId,
        status: 'active',
        birthDate: { not: null },
      },
      select: { birthDate: true },
    });

    const birthDates = rows
      .map((row) => row.birthDate)
      .filter((date): date is Date => date !== null);

    return countUpcomingBirthdays(birthDates, todayIsoDate, withinDays);
  }

  async findActiveWithBirthDate(
    storeId: string,
    search?: string,
  ): Promise<BirthdayPatient[]> {
    const trimmedSearch = search?.trim();
    const rows = await this.prisma.patient.findMany({
      where: {
        storeId,
        status: 'active',
        birthDate: { not: null },
        ...(trimmedSearch ? buildPatientSearchWhere(trimmedSearch) : {}),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        birthDate: true,
        photoObjectKey: true,
      },
    });

    return rows
      .filter((row): row is typeof row & { birthDate: Date } => row.birthDate !== null)
      .map((row) => ({
        id: row.id,
        name: row.name,
        phone: row.phone,
        birthDate: row.birthDate,
        photoObjectKey: row.photoObjectKey,
      }));
  }

  async listPatientsForAcquisitionInRange(
    storeId: string,
    range: { startAt: Date; endAt: Date },
  ): Promise<PatientAcquisitionListItem[]> {
    const rows = await this.prisma.patient.findMany({
      where: {
        storeId,
        createdAt: {
          gte: range.startAt,
          lte: range.endAt,
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        cpf: true,
        createdAt: true,
        referralOrigin: { select: { systemKey: true, name: true } },
      },
      orderBy: [{ createdAt: 'desc' }, { name: 'asc' }],
    });

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      cpf: row.cpf,
      createdAt: row.createdAt,
      referralOriginSystemKey: row.referralOrigin?.systemKey ?? null,
      referralOriginName: row.referralOrigin?.name ?? null,
    }));
  }

  async listAcquisitionYears(storeId: string): Promise<number[]> {
    const yearRows = await this.prisma.$queryRaw<Array<{ year: number }>>`
      SELECT DISTINCT EXTRACT(YEAR FROM created_at AT TIME ZONE 'UTC')::int AS year
      FROM clinica.patients
      WHERE store_id = ${storeId}
      ORDER BY year DESC
    `;

    return yearRows.map((row) => row.year);
  }

  async listPatientsForDemographics(
    storeId: string,
  ): Promise<PatientDemographicsListItem[]> {
    const rows = await this.prisma.patient.findMany({
      where: {
        storeId,
        status: 'active',
      },
      select: {
        birthDate: true,
        gender: true,
      },
    });

    return rows.map((row) => ({
      birthDate: row.birthDate,
      gender: row.gender,
    }));
  }

  async save(patient: Patient): Promise<Patient> {
    const row = await this.prisma.patient.upsert({
      where: { id: patient.id },
      create: {
        id: patient.id,
        storeId: patient.storeId,
        status: patient.status,
        name: patient.name,
        cpf: patient.cpf,
        rg: patient.rg,
        birthDate: patient.birthDate,
        gender: patient.gender,
        photoObjectKey: patient.photoObjectKey,
        photoMimeType: patient.photoMimeType,
        phone: patient.phone,
        landlinePhone: patient.landlinePhone,
        email: patient.email,
        socialNetwork: patient.socialNetwork,
        medicalRecordNumber: patient.medicalRecordNumber,
        referralOriginId: patient.referralOriginId,
        referredByPatientId: patient.referredByPatientId,
        referredByMemberId: patient.referredByMemberId,
        referredByMemberName: patient.referredByMemberName,
        referredByExternalProfessionalId:
          patient.referredByExternalProfessionalId,
        profession: patient.profession,
        categoryId: patient.categoryId,
        guardianName: patient.guardianName,
        guardianBirthDate: patient.guardianBirthDate,
        guardianCpf: patient.guardianCpf,
        guardianPhone: patient.guardianPhone,
        guardianNotes: patient.guardianNotes,
        zipCode: patient.zipCode,
        street: patient.street,
        streetNumber: patient.streetNumber,
        complement: patient.complement,
        neighborhood: patient.neighborhood,
        city: patient.city,
        state: patient.state,
        planId: patient.planId,
        planNumber: patient.planNumber,
        planHolderName: patient.planHolderName,
        planHolderCpf: patient.planHolderCpf,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      },
      update: {
        status: patient.status,
        name: patient.name,
        cpf: patient.cpf,
        rg: patient.rg,
        birthDate: patient.birthDate,
        gender: patient.gender,
        photoObjectKey: patient.photoObjectKey,
        photoMimeType: patient.photoMimeType,
        phone: patient.phone,
        landlinePhone: patient.landlinePhone,
        email: patient.email,
        socialNetwork: patient.socialNetwork,
        medicalRecordNumber: patient.medicalRecordNumber,
        referralOriginId: patient.referralOriginId,
        referredByPatientId: patient.referredByPatientId,
        referredByMemberId: patient.referredByMemberId,
        referredByMemberName: patient.referredByMemberName,
        referredByExternalProfessionalId:
          patient.referredByExternalProfessionalId,
        profession: patient.profession,
        categoryId: patient.categoryId,
        guardianName: patient.guardianName,
        guardianBirthDate: patient.guardianBirthDate,
        guardianCpf: patient.guardianCpf,
        guardianPhone: patient.guardianPhone,
        guardianNotes: patient.guardianNotes,
        zipCode: patient.zipCode,
        street: patient.street,
        city: patient.city,
        streetNumber: patient.streetNumber,
        complement: patient.complement,
        neighborhood: patient.neighborhood,
        state: patient.state,
        planId: patient.planId,
        planNumber: patient.planNumber,
        planHolderName: patient.planHolderName,
        planHolderCpf: patient.planHolderCpf,
        updatedAt: patient.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  private buildWhere(
    storeId: string,
    criteria: PatientListCriteria,
  ): Prisma.PatientWhereInput {
    const where: Prisma.PatientWhereInput = { storeId };

    if (criteria.categoryId) {
      where.categoryId = criteria.categoryId;
    }
    if (criteria.status) {
      where.status = criteria.status;
    }
    if (criteria.search) {
      Object.assign(where, buildPatientSearchWhere(criteria.search));
    }

    return where;
  }

  private buildOrderBy(
    criteria: PatientListCriteria,
  ): Prisma.PatientOrderByWithRelationInput {
    const direction = criteria.sortOrder === 'desc' ? 'desc' : 'asc';
    switch (criteria.sortBy) {
      case 'birthDate':
        return { birthDate: direction };
      case 'status':
        return { status: direction };
      case 'planName':
        return { plan: { name: direction } };
      case 'category':
        return { category: { name: direction } };
      case 'name':
      default:
        return { name: direction };
    }
  }

  private toDetail(row: PatientDetailRow): PatientDetail {
    return {
      patient: this.toEntity(row),
      categoryName: row.category.name,
      categoryColorId: row.category.colorId,
      planName: row.plan?.name ?? null,
      planStatus: row.plan?.status ?? null,
      referralOriginName: row.referralOrigin?.name ?? null,
      referralOriginSystemKey: row.referralOrigin?.systemKey ?? null,
      referredByPatientName: row.referredByPatient?.name ?? null,
      referredByExternalProfessionalName:
        row.referredByExternalProfessional?.name ?? null,
    };
  }

  private toEntity(row: PatientBaseRow): Patient {
    const props: PatientProps = {
      storeId: row.storeId,
      status: row.status,
      name: row.name,
      cpf: row.cpf,
      rg: row.rg,
      birthDate: row.birthDate,
      gender: row.gender,
      photoObjectKey: row.photoObjectKey,
      photoMimeType: row.photoMimeType,
      phone: row.phone,
      landlinePhone: row.landlinePhone,
      email: row.email,
      socialNetwork: row.socialNetwork,
      medicalRecordNumber: row.medicalRecordNumber,
      referralOriginId: row.referralOriginId,
      referredByPatientId: row.referredByPatientId,
      referredByMemberId: row.referredByMemberId,
      referredByMemberName: row.referredByMemberName,
      referredByExternalProfessionalId: row.referredByExternalProfessionalId,
      profession: row.profession,
      categoryId: row.categoryId,
      guardianName: row.guardianName,
      guardianBirthDate: row.guardianBirthDate,
      guardianCpf: row.guardianCpf,
      guardianPhone: row.guardianPhone,
      guardianNotes: row.guardianNotes,
      zipCode: row.zipCode,
      street: row.street,
      streetNumber: row.streetNumber,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      planId: row.planId,
      planNumber: row.planNumber,
      planHolderName: row.planHolderName,
      planHolderCpf: row.planHolderCpf,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Patient.with(props, row.id);
  }
}
