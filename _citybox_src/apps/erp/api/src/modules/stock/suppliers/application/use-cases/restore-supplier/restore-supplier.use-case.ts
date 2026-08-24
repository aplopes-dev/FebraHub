import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { Supplier } from '../../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../../domain/repositories/supplier.repository.interface';
import { SupplierNotFoundError } from '../../../domain/errors/supplier-not-found.error';
import type { RestoreSupplierDto } from '../../dtos/supplier.dto';

@Injectable()
export class RestoreSupplierUseCase implements IUseCase<
  RestoreSupplierDto,
  Supplier
> {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(input: RestoreSupplierDto): Promise<Supplier> {
    const supplier = await this.supplierRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!supplier) throw new SupplierNotFoundError(input.id);

    // Restaurar quem já está ativo não é erro: o botão pode ter sido clicado
    // duas vezes, e o resultado desejado — fornecedor ativo — é o mesmo.
    if (!supplier.deletedAt) return supplier;

    return this.supplierRepository.save(supplier.restore());
  }
}
