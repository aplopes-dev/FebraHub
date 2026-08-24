import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { PatientReferralOriginRepository } from '../../domain/repositories/patient-referral-origin.repository.interface';
import {
  PatientReferralOrigin,
  type PatientReferralOriginProps,
  type PatientReferralOriginSystemKey,
} from '../../domain/entities/patient-referral-origin.entity';

type OriginRow = {
  id: string;
  storeId: string;
  name: string;
  systemKey: PatientReferralOriginSystemKey | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaPatientReferralOriginRepository extends PatientReferralOriginRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<PatientReferralOrigin | null> {
    const row = await this.prisma.patientReferralOrigin.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<PatientReferralOrigin | null> {
    const row = await this.prisma.patientReferralOrigin.findFirst({
      where: { storeId, name: { equals: name, mode: 'insensitive' } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findBySystemKey(
    storeId: string,
    systemKey: PatientReferralOriginSystemKey,
  ): Promise<PatientReferralOrigin | null> {
    const row = await this.prisma.patientReferralOrigin.findFirst({
      where: { storeId, systemKey },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(storeId: string): Promise<PatientReferralOrigin[]> {
    const rows = await this.prisma.patientReferralOrigin.findMany({
      where: { storeId },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(origin: PatientReferralOrigin): Promise<PatientReferralOrigin> {
    const row = await this.prisma.patientReferralOrigin.upsert({
      where: { id: origin.id },
      create: {
        id: origin.id,
        storeId: origin.storeId,
        name: origin.name,
        systemKey: origin.systemKey,
        isSystem: origin.isSystem,
        createdAt: origin.createdAt,
        updatedAt: origin.updatedAt,
      },
      update: {
        name: origin.name,
        systemKey: origin.systemKey,
        isSystem: origin.isSystem,
        updatedAt: origin.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async saveMany(
    origins: readonly PatientReferralOrigin[],
  ): Promise<PatientReferralOrigin[]> {
    const saved: PatientReferralOrigin[] = [];
    for (const origin of origins) {
      saved.push(await this.save(origin));
    }
    return saved;
  }

  private toEntity(row: OriginRow): PatientReferralOrigin {
    const props: PatientReferralOriginProps = {
      storeId: row.storeId,
      name: row.name,
      systemKey: row.systemKey,
      isSystem: row.isSystem,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return PatientReferralOrigin.with(props, row.id);
  }
}
