import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ServiceProps } from '../entities/service.entity';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';

export class ServiceZodValidator implements Validator<ServiceProps> {
  private schema = z.object({
    storeId: z.uuid(),
    name: z
      .string()
      .min(2, 'O nome do serviço deve ter no mínimo 2 caracteres'),
    categories: z.array(z.string()).default([]),
    durationMinutes: z.number().positive('A duração deve ser maior que zero'),
    price: z.number().positive('O preço deve ser maior que zero'),
    description: z.string().nullable().optional(),
    active: z.boolean(),
    professionalIds: z.array(z.uuid()).optional(),
  });

  validate(input: ServiceProps): void {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      const message = ZodUtils.formatZodError(result.error);
      throw new ValidatorDomainError({
        internalMessage: `Service validation failed: ${message}`,
        externalMessage: message,
        context: 'ServiceValidator',
      });
    }
  }
}
