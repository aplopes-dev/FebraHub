import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { normalizeDocument } from '../../../../../../shared/core/utils/document';
import { BranchRepository } from '../../../../../tenancy/domain/repositories/branch.repository.interface';
import type { Supplier } from '../../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../../domain/repositories/supplier.repository.interface';
import { SupplierDocumentTakenError } from '../../../domain/errors/supplier-document-taken.error';
import { SupplierNotFoundError } from '../../../domain/errors/supplier-not-found.error';
import type { UpdateSupplierDto } from '../../dtos/supplier.dto';
import { assertBranchesBelongToOrganization } from '../assert-branches-belong-to-organization';

@Injectable()
export class UpdateSupplierUseCase implements IUseCase<
  UpdateSupplierDto,
  Supplier
> {
  constructor(
    private readonly supplierRepository: SupplierRepository,
    private readonly branchRepository: BranchRepository,
  ) {}

  async execute(input: UpdateSupplierDto): Promise<Supplier> {
    const supplier = await this.supplierRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!supplier || supplier.deletedAt) {
      throw new SupplierNotFoundError(input.id);
    }

    const document = normalizeDocument(input.document);
    if (document !== supplier.document) {
      const other = await this.supplierRepository.findByDocument(
        input.organizationId,
        document,
      );
      // Só conflita se o documento pertencer a OUTRO fornecedor — reenviar o
      // próprio documento no PUT é o caso comum, não um erro.
      if (other && other.id !== supplier.id) {
        throw new SupplierDocumentTakenError(
          document,
          other.deletedAt !== null,
        );
      }
    }

    const branchIds = await assertBranchesBelongToOrganization(
      this.branchRepository,
      input.organizationId,
      input.branchIds,
    );

    const updated = supplier.update({
      personType: input.personType,
      name: input.name,
      legalName: input.legalName ?? null,
      document,
      stateRegistration: input.stateRegistration ?? null,
      stateExempt: input.stateExempt ?? false,
      municipalRegistration: input.municipalRegistration ?? null,
      sufamaRegistration: input.sufamaRegistration ?? null,
      foundationDate: input.foundationDate ?? null,
      note: input.note ?? '',
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

    return this.supplierRepository.save(updated);
  }
}
