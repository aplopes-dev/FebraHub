import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { OperationNatureNotFoundError } from '../../../domain/errors/operation-nature-not-found.error';
import { OperationNatureRepository } from '../../../domain/repositories/operation-nature.repository.interface';
import type { DeleteOperationNatureDto } from '../../dtos/operation-nature.dto';

/**
 * Exclui uma natureza de operação (spec erp/024, Parte A). Hard delete —
 * cascata nas filhas (`OperationNatureCfopRule`/`OperationNatureGroupRule`)
 * já garantida pelo schema (`onDelete: Cascade`).
 *
 * Diferente de `DeleteFiscalGroupUseCase` (spec erp/022): nenhuma outra
 * tabela referencia `OperationNature` (confirmado no `plan.md` da 024 por
 * grep no schema inteiro) — não há checagem de "em uso" para fazer. A
 * exclusão só afeta a **resolução de emissões futuras**
 * (`ResolveOperationNatureUseCase`), nunca documentos já emitidos.
 */
@Injectable()
export class DeleteOperationNatureUseCase implements IUseCase<
  DeleteOperationNatureDto,
  void
> {
  constructor(private readonly repository: OperationNatureRepository) {}

  async execute(input: DeleteOperationNatureDto): Promise<void> {
    const nature = await this.repository.findById(
      input.organizationId,
      input.id,
    );
    if (!nature) {
      throw new OperationNatureNotFoundError(input.id);
    }
    await this.repository.deleteById(input.organizationId, input.id);
  }
}
