import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { AppointmentCategoryProps } from '../entities/appointment-category.entity';

const schema = z.object({
  storeId: z.uuid(),
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório.')
    .max(120, 'Nome deve ter no máximo 120 caracteres.'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve ser hex #rrggbb'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export class AppointmentCategoryZodValidator implements Validator<AppointmentCategoryProps> {
  validate(input: AppointmentCategoryProps): void {
    const result = schema.safeParse(input);
    if (!result.success) {
      const message = ZodUtils.formatZodError(result.error);
      throw new ValidatorDomainError({
        internalMessage: `AppointmentCategory validation failed: ${message}`,
        externalMessage: message,
        context: 'AppointmentCategoryValidator',
      });
    }
  }
}
