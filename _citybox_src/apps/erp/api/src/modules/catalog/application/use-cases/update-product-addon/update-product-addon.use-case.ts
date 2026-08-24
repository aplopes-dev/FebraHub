import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductAddon } from '../../../domain/entities/product-addon.entity';
import { ProductAddonRepository } from '../../../domain/repositories/product-addon.repository.interface';
import { ProductAddonNotFoundError } from '../../../domain/errors/product-addon-not-found.error';
import { ProductAddonNameTakenError } from '../../../domain/errors/product-addon-name-taken.error';
import type { UpdateProductAddonDto } from '../../dtos/product-addon.dto';

@Injectable()
export class UpdateProductAddonUseCase implements IUseCase<
  UpdateProductAddonDto,
  ProductAddon
> {
  constructor(private readonly addonRepository: ProductAddonRepository) {}

  async execute(input: UpdateProductAddonDto): Promise<ProductAddon> {
    const addon = await this.addonRepository.findById(
      input.organizationId,
      input.id,
    );
    if (!addon) throw new ProductAddonNotFoundError(input.id);

    const name = input.name.trim();
    const duplicate = await this.addonRepository.findByName(
      input.organizationId,
      name,
    );
    if (duplicate && duplicate.id !== input.id) {
      throw new ProductAddonNameTakenError(name);
    }

    const updated = addon.update({
      name,
      defaultPriceCents: input.defaultPriceCents,
    });
    return this.addonRepository.save(updated);
  }
}
