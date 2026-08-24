import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { normalizeDocument } from '../../../../../../shared/core/utils/document';
import { BranchRepository } from '../../../../../tenancy/domain/repositories/branch.repository.interface';
import { Carrier } from '../../../domain/entities/carrier.entity';
import { CarrierRepository } from '../../../domain/repositories/carrier.repository.interface';
import { CarrierDocumentTakenError } from '../../../domain/errors/carrier-document-taken.error';
import type { CreateCarrierDto } from '../../dtos/carrier.dto';
import { assertBranchesBelongToOrganization } from '../assert-branches-belong-to-organization';

/**
 * Cadastra uma transportadora da organização ativa.
 *
 * Duas invariantes: documento único na organização e unidades que existem nela.
 */
@Injectable()
export class CreateCarrierUseCase implements IUseCase<
  CreateCarrierDto,
  Carrier
> {
  constructor(
    private readonly carrierRepository: CarrierRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: CreateCarrierDto): Promise<Carrier> {
    const document = normalizeDocument(input.document);

    const existing = await this.carrierRepository.findByDocument(
      input.organizationId,
      document,
    );
    // A busca alcança as excluídas porque o unique do banco também alcança — a
    // mensagem muda para o usuário saber que existe algo a restaurar.
    if (existing) {
      throw new CarrierDocumentTakenError(
        document,
        existing.deletedAt !== null,
      );
    }

    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    const carrier = Carrier.create({
      organizationId: input.organizationId,
      personType: input.personType,
      deliveryType: input.deliveryType,
      name: input.name,
      legalName: input.legalName,
      document,
      icmsExempt: input.icmsExempt,
      registerInNfe: input.registerInNfe,
      stateRegistration: input.stateRegistration,
      stateExempt: input.stateExempt,
      municipalRegistration: input.municipalRegistration,
      email: input.email,
      commercialPhone: input.commercialPhone,
      mobilePhone: input.mobilePhone,
      zipCode: input.zipCode,
      street: input.street,
      number: input.number,
      complement: input.complement,
      district: input.district,
      city: input.city,
      state: input.state,
      branchIds,
    });

    return this.carrierRepository.save(carrier);
  }
}
