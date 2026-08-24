import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import { ExternalReferralProfessionalRepository } from '../../domain/repositories/external-referral-professional.repository.interface';
import {
  ExternalReferralProfessional,
  type ExternalReferralProfessionalProps,
} from '../../domain/entities/external-referral-professional.entity';

type ProfessionalRow = {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  cro: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaExternalReferralProfessionalRepository extends ExternalReferralProfessionalRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    storeId: string,
    id: string,
  ): Promise<ExternalReferralProfessional | null> {
    const row = await this.prisma.externalReferralProfessional.findFirst({
      where: { id, storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    storeId: string,
    name: string,
  ): Promise<ExternalReferralProfessional | null> {
    const row = await this.prisma.externalReferralProfessional.findFirst({
      where: { storeId, name: { equals: name, mode: 'insensitive' } },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(storeId: string): Promise<ExternalReferralProfessional[]> {
    const rows = await this.prisma.externalReferralProfessional.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async save(
    professional: ExternalReferralProfessional,
  ): Promise<ExternalReferralProfessional> {
    const row = await this.prisma.externalReferralProfessional.upsert({
      where: { id: professional.id },
      create: {
        id: professional.id,
        storeId: professional.storeId,
        name: professional.name,
        phone: professional.phone,
        cro: professional.cro,
        createdAt: professional.createdAt,
        updatedAt: professional.updatedAt,
      },
      update: {
        name: professional.name,
        phone: professional.phone,
        cro: professional.cro,
        updatedAt: professional.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  async delete(storeId: string, id: string): Promise<void> {
    await this.prisma.externalReferralProfessional.deleteMany({
      where: { id, storeId },
    });
  }

  private toEntity(row: ProfessionalRow): ExternalReferralProfessional {
    const props: ExternalReferralProfessionalProps = {
      storeId: row.storeId,
      name: row.name,
      phone: row.phone,
      cro: row.cro,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ExternalReferralProfessional.with(props, row.id);
  }
}
