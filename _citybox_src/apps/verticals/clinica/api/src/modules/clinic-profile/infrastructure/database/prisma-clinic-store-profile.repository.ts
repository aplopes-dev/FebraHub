import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import { ClinicStoreProfileRepository } from '../../domain/repositories/clinic-store-profile.repository.interface';
import {
  ClinicStoreProfile,
  type ClinicStoreProfileProps,
} from '../../domain/entities/clinic-store-profile.entity';

@Injectable()
export class PrismaClinicStoreProfileRepository extends ClinicStoreProfileRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByStoreId(storeId: string): Promise<ClinicStoreProfile | null> {
    const row = await this.prisma.clinicStoreProfile.findUnique({
      where: { storeId },
    });
    return row ? this.toEntity(row) : null;
  }

  async save(profile: ClinicStoreProfile): Promise<ClinicStoreProfile> {
    const row = await this.prisma.clinicStoreProfile.upsert({
      where: { storeId: profile.storeId },
      create: {
        storeId: profile.storeId,
        clinicName: profile.clinicName,
        cnpj: profile.cnpj,
        communicationsName: profile.communicationsName,
        responsible: profile.responsible,
        logoObjectKey: profile.logoObjectKey,
        logoMimeType: profile.logoMimeType,
        openingTime: profile.openingTime,
        closingTime: profile.closingTime,
        email: profile.email,
        phone: profile.phone,
        mobile: profile.mobile,
        cep: profile.cep,
        street: profile.street,
        number: profile.number,
        complement: profile.complement,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      },
      update: {
        clinicName: profile.clinicName,
        cnpj: profile.cnpj,
        communicationsName: profile.communicationsName,
        responsible: profile.responsible,
        logoObjectKey: profile.logoObjectKey,
        logoMimeType: profile.logoMimeType,
        openingTime: profile.openingTime,
        closingTime: profile.closingTime,
        email: profile.email,
        phone: profile.phone,
        mobile: profile.mobile,
        cep: profile.cep,
        street: profile.street,
        number: profile.number,
        complement: profile.complement,
        neighborhood: profile.neighborhood,
        city: profile.city,
        state: profile.state,
        updatedAt: profile.updatedAt,
      },
    });
    return this.toEntity(row);
  }

  private toEntity(row: {
    storeId: string;
    clinicName: string;
    cnpj: string;
    communicationsName: string;
    responsible: string;
    logoObjectKey: string | null;
    logoMimeType: string | null;
    openingTime: string;
    closingTime: string;
    email: string;
    phone: string;
    mobile: string;
    cep: string;
    street: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    createdAt: Date;
    updatedAt: Date;
  }): ClinicStoreProfile {
    const props: ClinicStoreProfileProps = {
      storeId: row.storeId,
      clinicName: row.clinicName,
      cnpj: row.cnpj,
      communicationsName: row.communicationsName,
      responsible: row.responsible,
      logoObjectKey: row.logoObjectKey,
      logoMimeType: row.logoMimeType,
      openingTime: row.openingTime,
      closingTime: row.closingTime,
      email: row.email,
      phone: row.phone,
      mobile: row.mobile,
      cep: row.cep,
      street: row.street,
      number: row.number,
      complement: row.complement,
      neighborhood: row.neighborhood,
      city: row.city,
      state: row.state,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ClinicStoreProfile.with(props, row.storeId);
  }
}
