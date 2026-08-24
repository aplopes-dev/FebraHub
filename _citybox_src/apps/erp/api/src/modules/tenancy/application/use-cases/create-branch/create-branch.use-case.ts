import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { normalizeDocument } from '../../../../../shared/core/utils/document';
import { Branch } from '../../../domain/entities/branch.entity';
import { BranchRepository } from '../../../domain/repositories/branch.repository.interface';
import { BranchCodeTakenError } from '../../../domain/errors/branch-code-taken.error';
import { BranchDocumentTakenError } from '../../../domain/errors/branch-document-taken.error';
import { HeadquartersDuplicateError } from '../../../domain/errors/headquarters-duplicate.error';
import type { CreateBranchDto } from '../../dtos/branch.dto';

/**
 * Cria uma unidade da organização ativa.
 *
 * Três invariantes, todas dentro da organização: código único, documento único
 * e no máximo uma matriz.
 */
@Injectable()
export class CreateBranchUseCase implements IUseCase<CreateBranchDto, Branch> {
  constructor(private readonly branchRepository: BranchRepository) {}

  async execute(input: CreateBranchDto): Promise<Branch> {
    const code = input.code.trim();
    const document = normalizeDocument(input.document);

    const [byCode, byDocument] = await Promise.all([
      this.branchRepository.findByCode(input.organizationId, code),
      this.branchRepository.findByDocument(input.organizationId, document),
    ]);
    // A busca alcança unidades desativadas porque o unique do banco também
    // alcança — a mensagem muda para o usuário saber que existe algo a reativar.
    if (byCode) throw new BranchCodeTakenError(code, byCode.deletedAt !== null);
    if (byDocument) {
      throw new BranchDocumentTakenError(
        document,
        byDocument.deletedAt !== null,
      );
    }

    if (input.isHeadquarters) {
      const headquarters = await this.branchRepository.findHeadquarters(
        input.organizationId,
      );
      if (headquarters) throw new HeadquartersDuplicateError(headquarters.code);
    }

    const branch = Branch.create({
      organizationId: input.organizationId,
      code,
      personType: input.personType,
      document,
      legalName: input.legalName,
      tradeName: input.tradeName ?? null,
      stateRegistration: input.stateRegistration ?? null,
      municipalRegistration: input.municipalRegistration ?? null,
      taxRegime: input.taxRegime,
      isHeadquarters: input.isHeadquarters ?? false,
      zipCode: input.zipCode ?? null,
      street: input.street ?? null,
      number: input.number ?? null,
      complement: input.complement ?? null,
      neighborhood: input.neighborhood ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      timezone: input.timezone,
    });

    return this.branchRepository.save(branch);
  }
}
