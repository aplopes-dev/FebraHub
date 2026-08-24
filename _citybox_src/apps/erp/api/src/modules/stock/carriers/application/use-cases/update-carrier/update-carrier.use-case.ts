import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { normalizeDocument } from '../../../../../../shared/core/utils/document';
import { BranchRepository } from '../../../../../tenancy/domain/repositories/branch.repository.interface';
import type { Carrier } from '../../../domain/entities/carrier.entity';
import { CarrierRepository } from '../../../domain/repositories/carrier.repository.interface';
import { CarrierDocumentTakenError } from '../../../domain/errors/carrier-document-taken.error';
import { CarrierNotFoundError } from '../../../domain/errors/carrier-not-found.error';
import type { UpdateCarrierDto } from '../../dtos/carrier.dto';
import { assertBranchesBelongToOrganization } from '../assert-branches-belong-to-organization';

@Injectable()
export class UpdateCarrierUseCase implements IUseCase<
  UpdateCarrierDto,
  Carrier
> {
  constructor(
    private readonly carrierRepository: CarrierRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: UpdateCarrierDto): Promise<Carrier> {
    const carrier = await this.carrierRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!carrier || carrier.deletedAt) {
      throw new CarrierNotFoundError(input.id);
    }

    const document = normalizeDocument(input.document);
    if (document !== carrier.document) {
      const other = await this.carrierRepository.findByDocument(
        input.organizationId,
        document,
      );
      // Só conflita se o documento pertencer a OUTRA transportadora — reenviar
      // o próprio documento no PUT é o caso comum, não um erro.
      if (other && other.id !== carrier.id) {
        throw new CarrierDocumentTakenError(document, other.deletedAt !== null);
      }
    }

    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    const updated = carrier.update({
      personType: input.personType,
      deliveryType: input.deliveryType,
      name: input.name,
      legalName: input.legalName ?? null,
      document,
      icmsExempt: input.icmsExempt ?? false,
      registerInNfe: input.registerInNfe ?? false,
      stateRegistration: input.stateRegistration ?? null,
      stateExempt: input.stateExempt ?? false,
      municipalRegistration: input.municipalRegistration ?? null,
      email: input.email ?? null,
      commercialPhone: input.commercialPhone ?? null,
      mobilePhone: input.mobilePhone ?? null,
      zipCode: input.zipCode ?? null,
      street: input.street ?? null,
      number: input.number ?? null,
      complement: input.complement ?? null,
      district: input.district ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      branchIds,
    });

    return this.carrierRepository.save(updated);
  }
}
