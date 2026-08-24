import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  isValidDocument,
  PERSON_TYPES,
} from '../../../../shared/core/utils/document';
import {
  ORGANIZATION_STATUSES,
  type Organization,
} from '../entities/organization.entity';

export class OrganizationZodValidator implements Validator<Organization> {
  private constructor() {}

  public static create(): OrganizationZodValidator {
    return new OrganizationZodValidator();
  }

  public validate(input: Organization): void {
    try {
      this.getSchema().parse(input.props);
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const message = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Organization ${input.props.document}: ${message}`,
          externalMessage: message,
          context: OrganizationZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Organization: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados da organização',
        context: OrganizationZodValidator.name,
      });
    }
  }

  private getSchema() {
    return (
      z
        .object({
          personType: z.enum(PERSON_TYPES),
          document: z.string().regex(/^\d+$/, 'deve conter apenas dígitos'),
          legalName: z.string().trim().min(2).max(200),
          tradeName: z.string().trim().min(1).max(200).nullable(),
          email: z.string().email().max(200),
          phone: z.string().trim().min(8).max(20).nullable(),
          responsibleName: z.string().trim().min(2).max(200),
          responsibleDocument: z
            .string()
            .regex(/^\d{11}$/, 'CPF do responsável deve ter 11 dígitos')
            .nullable(),
          responsibleEmail: z.string().email().max(200).nullable(),
          responsiblePhone: z.string().trim().min(8).max(20).nullable(),
          status: z.enum(ORGANIZATION_STATUSES),
          platformStoreId: z.string().uuid().nullable(),
          // Espelho do plano contratado na plataforma: o ERP copia, não julga.
          // Um tier novo lá não pode reprovar a organização aqui.
          planId: z.string().nullable(),
          planTier: z.string().nullable(),
          planMaxBranches: z.number().int().nonnegative().nullable(),
          planMaxUsers: z.number().int().nonnegative().nullable(),
          suspendedReason: z.string().max(200).nullable(),
          platformUpdatedAt: z.date().nullable(),
          syncedAt: z.date().nullable(),
          deletedAt: z.date().nullable(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
        // O dígito verificador só faz sentido depois de saber se é CPF ou CNPJ —
        // daí a checagem cruzada em vez de um regex de tamanho fixo.
        .refine((data) => isValidDocument(data.personType, data.document), {
          path: ['document'],
          message: 'documento inválido para o tipo de pessoa informado',
        })
    );
  }
}
