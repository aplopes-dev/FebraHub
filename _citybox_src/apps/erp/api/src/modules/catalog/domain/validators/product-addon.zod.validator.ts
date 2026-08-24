import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { ProductAddon } from '../entities/product-addon.entity';

export class ProductAddonZodValidator implements Validator<ProductAddon> {
  private constructor() {}

  public static create(): ProductAddonZodValidator {
    return new ProductAddonZodValidator();
  }

  public validate(input: ProductAddon): void {
    try {
      this.getSchema().parse({
        organizationId: input.props.organizationId,
        name: input.props.name,
        defaultPriceCents: input.props.defaultPriceCents,
        deletedAt: input.props.deletedAt,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating ProductAddon: ${msg}`,
          externalMessage: msg,
          context: ProductAddonZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating ProductAddon: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do adicional',
        context: ProductAddonZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      organizationId: z.string().min(1),
      name: z.string().trim().min(1).max(120),
      defaultPriceCents: z.number().int().min(0),
      deletedAt: z.date().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
