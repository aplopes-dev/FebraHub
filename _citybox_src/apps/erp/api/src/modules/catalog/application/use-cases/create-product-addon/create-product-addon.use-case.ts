import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ProductAddon } from '../../../domain/entities/product-addon.entity';
import { ProductAddonRepository } from '../../../domain/repositories/product-addon.repository.interface';
import { ProductAddonNameTakenError } from '../../../domain/errors/product-addon-name-taken.error';
import type { CreateProductAddonDto } from '../../dtos/product-addon.dto';

@Injectable()
export class CreateProductAddonUseCase implements IUseCase<
  CreateProductAddonDto,
  ProductAddon
> {
  constructor(private readonly addonRepository: ProductAddonRepository) {}

  async execute(input: CreateProductAddonDto): Promise<ProductAddon> {
    const name = input.name.trim();
    const existing = await this.addonRepository.findByName(
      input.organizationId,
      name,
    );
    if (existing) throw new ProductAddonNameTakenError(name);

    const addon = ProductAddon.create({
      organizationId: input.organizationId,
      name,
      defaultPriceCents: input.defaultPriceCents,
    });

    return this.addonRepository.save(addon);
  }
}
