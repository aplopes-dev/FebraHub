import { z } from 'zod';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';

const patientFolderNameSchema = z
  .string()
  .trim()
  .min(1, 'Informe o nome da pasta')
  .refine((value) => !value.includes('/'), {
    message: 'O nome da pasta não pode conter "/"',
  });

export class PatientFolderNameValidator {
  static validate(name: string, context: string): string {
    const result = patientFolderNameSchema.safeParse(name);
    if (!result.success) {
      throw new ValidatorDomainError({
        internalMessage: result.error.issues.map((i) => i.message).join('; '),
        externalMessage:
          result.error.issues[0]?.message ?? 'Nome de pasta inválido',
        context,
      });
    }
    return result.data;
  }
}
