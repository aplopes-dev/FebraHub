import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ClientProps } from '../entities/client.entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

export class ClientZodValidator implements Validator<ClientProps> {
  private schema = z.object({
    storeId: z.string().uuid(),
    name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
    phone: z
      .string()
      .min(8, 'O telefone/WhatsApp deve ter no mínimo 8 caracteres'),
    categoryId: z.string().uuid().nullable().optional(),
  });

  validate(input: ClientProps): void {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      const message = ZodUtils.formatZodError(result.error);
      throw new ValidatorDomainError({
        internalMessage: `Client validation failed: ${message}`,
        externalMessage: message,
        context: 'ClientValidator',
      });
    }
  }
}
