import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ClinicStoreProfileRepository } from '../../../domain/repositories/clinic-store-profile.repository.interface';
import { ClinicStoreProfile } from '../../../domain/entities/clinic-store-profile.entity';
import type { UpsertClinicProfileDto } from '../../dtos/clinic-profile.dto';

@Injectable()
export class UpsertClinicProfileUseCase implements IUseCase<
  UpsertClinicProfileDto,
  ClinicStoreProfile
> {
  constructor(private readonly repository: ClinicStoreProfileRepository) {}

  async execute(dto: UpsertClinicProfileDto): Promise<ClinicStoreProfile> {
    const existing = await this.repository.findByStoreId(dto.storeId);

    if (existing) {
      existing.update({
        clinicName: dto.clinicName,
        cnpj: dto.cnpj,
        communicationsName: dto.communicationsName,
        responsible: dto.responsible,
        openingTime: dto.openingTime,
        closingTime: dto.closingTime,
        email: dto.email,
        phone: dto.phone,
        mobile: dto.mobile,
        cep: dto.cep,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
      });
      return this.repository.save(existing);
    }

    const profile = ClinicStoreProfile.create({
      storeId: dto.storeId,
      clinicName: dto.clinicName,
      cnpj: dto.cnpj,
      communicationsName: dto.communicationsName,
      responsible: dto.responsible,
      openingTime: dto.openingTime,
      closingTime: dto.closingTime,
      email: dto.email,
      phone: dto.phone,
      mobile: dto.mobile,
      cep: dto.cep,
      street: dto.street,
      number: dto.number,
      complement: dto.complement,
      neighborhood: dto.neighborhood,
      city: dto.city,
      state: dto.state,
    });

    return this.repository.save(profile);
  }
}
