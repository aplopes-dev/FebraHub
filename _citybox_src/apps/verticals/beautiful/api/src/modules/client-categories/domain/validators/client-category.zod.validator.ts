import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { ClientCategoryProps } from '../entities/client-category.entity';

export class ClientCategoryZodValidator implements Validator<ClientCategoryProps> {
  private schema = z.object({
    storeId: z.string().uuid(),
    name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
    colorId: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex #rrggbb'),
    isProtected: z.boolean(),
  });

  validate(input: ClientCategoryProps): void {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      const message = ZodUtils.formatZodError(result.error);
      throw new ValidatorDomainError({
        internalMessage: `ClientCategory validation failed: ${message}`,
        externalMessage: message,
        context: 'ClientCategoryValidator',
      });
    }
  }
}
