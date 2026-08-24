import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import {
  isValidDocument,
  PERSON_TYPES,
} from '../../../../../shared/core/utils/document';
import {
  CARRIER_DELIVERY_TYPES,
  type Carrier,
} from '../entities/carrier.entity';

export class CarrierZodValidator implements Validator<Carrier> {
  private constructor() {}

  public static create(): CarrierZodValidator {
    return new CarrierZodValidator();
  }

  public validate(input: Carrier): void {
    try {
      this.getSchema().parse(input.props);
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const message = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Carrier ${input.props.name}: ${message}`,
          externalMessage: message,
          context: CarrierZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Carrier: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados da transportadora',
        context: CarrierZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z
      .object({
        organizationId: z.string().uuid(),
        personType: z.enum(PERSON_TYPES),
        deliveryType: z.enum(CARRIER_DELIVERY_TYPES),
        name: z.string().trim().min(2).max(200),
        legalName: z.string().trim().min(2).max(200).nullable(),
        document: z.string().regex(/^\d+$/, 'deve conter apenas dígitos'),
        icmsExempt: z.boolean(),
        registerInNfe: z.boolean(),
        stateRegistration: z.string().trim().max(30).nullable(),
        stateExempt: z.boolean(),
        municipalRegistration: z.string().trim().max(30).nullable(),
        email: z.string().email().max(200).nullable(),
        commercialPhone: z.string().trim().min(8).max(20).nullable(),
        mobilePhone: z.string().trim().min(8).max(20).nullable(),
        zipCode: z
          .string()
          .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
          .nullable(),
        street: z.string().trim().max(200).nullable(),
        number: z.string().trim().max(20).nullable(),
        complement: z.string().trim().max(100).nullable(),
        district: z.string().trim().max(100).nullable(),
        city: z.string().trim().max(100).nullable(),
        state: z
          .string()
          .regex(/^[A-Z]{2}$/, 'UF deve ter 2 letras')
          .nullable(),
        branchIds: z.array(z.string().uuid()),
        deletedAt: z.date().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      })
      .refine((data) => isValidDocument(data.personType, data.document), {
        path: ['document'],
        message: 'documento inválido para o tipo de pessoa informado',
      })
      .refine((data) => !(data.stateExempt && data.stateRegistration), {
        path: ['stateRegistration'],
        message: 'transportadora isenta não pode ter inscrição estadual',
      });
  }
}
