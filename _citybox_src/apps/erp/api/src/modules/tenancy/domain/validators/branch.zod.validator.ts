import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  isValidDocument,
  PERSON_TYPES,
} from '../../../../shared/core/utils/document';
import { TAX_REGIMES, type Branch } from '../entities/branch.entity';

export class BranchZodValidator implements Validator<Branch> {
  private constructor() {}

  public static create(): BranchZodValidator {
    return new BranchZodValidator();
  }

  public validate(input: Branch): void {
    try {
      this.getSchema().parse(input.props);
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const message = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Branch ${input.props.code}: ${message}`,
          externalMessage: message,
          context: BranchZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Branch: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados da unidade',
        context: BranchZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z
      .object({
        organizationId: z.string().uuid(),
        code: z.string().trim().min(1).max(20),
        personType: z.enum(PERSON_TYPES),
        document: z.string().regex(/^\d+$/, 'deve conter apenas dígitos'),
        legalName: z.string().trim().min(2).max(200),
        tradeName: z.string().trim().min(1).max(200).nullable(),
        stateRegistration: z.string().trim().max(30).nullable(),
        municipalRegistration: z.string().trim().max(30).nullable(),
        taxRegime: z.enum(TAX_REGIMES),
        isHeadquarters: z.boolean(),
        zipCode: z
          .string()
          .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
          .nullable(),
        street: z.string().trim().max(200).nullable(),
        number: z.string().trim().max(20).nullable(),
        complement: z.string().trim().max(100).nullable(),
        neighborhood: z.string().trim().max(100).nullable(),
        city: z.string().trim().max(100).nullable(),
        state: z
          .string()
          .regex(/^[A-Z]{2}$/, 'UF deve ter 2 letras')
          .nullable(),
        phone: z.string().trim().min(8).max(20).nullable(),
        email: z.string().email().max(200).nullable(),
        timezone: z.string().trim().min(1).max(60),
        active: z.boolean(),
        deletedAt: z.date().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      })
      .refine((data) => isValidDocument(data.personType, data.document), {
        path: ['document'],
        message: 'documento inválido para o tipo de pessoa informado',
      });
  }
}
