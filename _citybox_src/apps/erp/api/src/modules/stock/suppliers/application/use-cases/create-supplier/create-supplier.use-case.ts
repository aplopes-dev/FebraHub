import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { normalizeDocument } from '../../../../../../shared/core/utils/document';
import { BranchRepository } from '../../../../../tenancy/domain/repositories/branch.repository.interface';
import { Supplier } from '../../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../../domain/repositories/supplier.repository.interface';
import { SupplierDocumentTakenError } from '../../../domain/errors/supplier-document-taken.error';
import type { CreateSupplierDto } from '../../dtos/supplier.dto';
import { assertBranchesBelongToOrganization } from '../assert-branches-belong-to-organization';

/**
 * Cadastra um fornecedor da organização ativa.
 *
 * Duas invariantes: documento único na organização e unidades que existem nela.
 */
@Injectable()
export class CreateSupplierUseCase implements IUseCase<
  CreateSupplierDto,
  Supplier
> {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: CreateSupplierDto): Promise<Supplier> {
    const document = normalizeDocument(input.document);

    const existing = await this.supplierRepository.findByDocument(
      input.organizationId,
      document,
    );
    // A busca alcança os excluídos porque o unique do banco também alcança — a
    // mensagem muda para o usuário saber que existe algo a restaurar.
    if (existing) {
      throw new SupplierDocumentTakenError(
        document,
        existing.deletedAt !== null,
      );
    }

    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    const supplier = Supplier.create({
      organizationId: input.organizationId,
      personType: input.personType,
      name: input.name,
      legalName: input.legalName,
      document,
      stateRegistration: input.stateRegistration,
      stateExempt: input.stateExempt,
      municipalRegistration: input.municipalRegistration,
      sufamaRegistration: input.sufamaRegistration,
      foundationDate: input.foundationDate,
      note: input.note,
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

    return this.supplierRepository.save(supplier);
  }
}
