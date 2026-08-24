import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import { StoreSettingsProps } from '../entities/store-settings.entity';
import { ALLOWED_THEME_IDS, DEFAULT_STORE_THEME_ID } from '../store-theme-ids';

const optionalString = (max: number) =>
  z
    .string()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v));

export class StoreSettingsZodValidator implements Validator<StoreSettingsProps> {
  private schema = z.object({
    storeId: z.uuid(),
    name: z.string().min(2).max(200),
    themeId: z.enum(ALLOWED_THEME_IDS).default(DEFAULT_STORE_THEME_ID),
    cnpj: optionalString(18),
    communicationsName: optionalString(200),
    responsible: optionalString(200),
    email: optionalString(200),
    phone: optionalString(20),
    mobile: optionalString(20),
    cep: optionalString(9),
    street: optionalString(200),
    number: optionalString(20),
    complement: optionalString(100),
    neighborhood: optionalString(100),
    city: optionalString(100),
    state: z
      .string()
      .length(2)
      .nullable()
      .optional()
      .transform((v) =>
        v === '' || v === undefined ? null : v?.toUpperCase(),
      ),
    logoObjectKey: z.string().nullable().optional(),
    logoMimeType: z.string().nullable().optional(),
  });

  validate(input: StoreSettingsProps): void {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      const message = ZodUtils.formatZodError(result.error);
      throw new ValidatorDomainError({
        internalMessage: `StoreSettings validation failed: ${message}`,
        externalMessage: message,
        context: 'StoreSettingsValidator',
      });
    }
  }
}
