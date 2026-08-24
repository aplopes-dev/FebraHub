import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductAddonRepository } from '../../../domain/repositories/product-addon.repository.interface';
import { ProductAddonNotFoundError } from '../../../domain/errors/product-addon-not-found.error';
import type { DeleteProductAddonDto } from '../../dtos/product-addon.dto';

/**
 * Exclui o adicional (soft-delete, FR-004).
 *
 * Nunca apaga: produtos que já vincularam este adicional continuam
 * carregando normalmente, congelando nome/preço no vínculo — só o catálogo
 * (seletor de novas linhas) deixa de oferecê-lo.
 */
@Injectable()
export class DeleteProductAddonUseCase implements IUseCase<
  DeleteProductAddonDto,
  void
> {
  constructor(private readonly addonRepository: ProductAddonRepository) {}

  async execute(input: DeleteProductAddonDto): Promise<void> {
    const addon = await this.addonRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!addon || addon.isDeleted()) {
      throw new ProductAddonNotFoundError(input.id);
    }

    await this.addonRepository.save(addon.softDelete());
  }
}
