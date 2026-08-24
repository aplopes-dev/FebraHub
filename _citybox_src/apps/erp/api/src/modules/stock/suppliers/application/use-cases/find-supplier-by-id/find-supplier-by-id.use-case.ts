import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type { Supplier } from '../../../domain/entities/supplier.entity';
import { SupplierRepository } from '../../../domain/repositories/supplier.repository.interface';
import { SupplierNotFoundError } from '../../../domain/errors/supplier-not-found.error';
import type { FindSupplierByIdDto } from '../../dtos/supplier.dto';

@Injectable()
export class FindSupplierByIdUseCase implements IUseCase<
  FindSupplierByIdDto,
  Supplier
> {
  constructor(private readonly supplierRepository: SupplierRepository) {}

  async execute(input: FindSupplierByIdDto): Promise<Supplier> {
    const supplier = await this.supplierRepository.findById(
      input.organizationId,
      input.id,
    );
    // Fornecedor de outra organização e fornecedor inexistente devolvem o mesmo
    // 404 — a diferença revelaria que o id existe em outro tenant.
    //
    // Excluído, porém, é devolvido: a aba "Excluídos" da listagem leva a ele, e
    // a tela precisa mostrar o cadastro antes de restaurar.
    if (!supplier) throw new SupplierNotFoundError(input.id);

    return supplier;
  }
}
