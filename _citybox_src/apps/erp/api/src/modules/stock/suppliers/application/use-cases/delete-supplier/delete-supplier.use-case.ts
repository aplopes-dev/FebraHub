import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { SupplierRepository } from '../../../domain/repositories/supplier.repository.interface';
import { SupplierNotFoundError } from '../../../domain/errors/supplier-not-found.error';
import type { DeleteSupplierDto } from '../../dtos/supplier.dto';

/**
 * Exclui o fornecedor (soft-delete).
 *
 * Nunca apaga: compras e pedidos já registrados apontam para ele, e o histórico
 * de custo precisa continuar resolvendo.
 */
@Injectable()
export class DeleteSupplierUseCase implements IUseCase<
  DeleteSupplierDto,
  void
> {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(input: DeleteSupplierDto): Promise<void> {
    const supplier = await this.supplierRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!supplier || supplier.deletedAt) {
      throw new SupplierNotFoundError(input.id);
    }

    await this.supplierRepository.save(supplier.softDelete());
  }
}
