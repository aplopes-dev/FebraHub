import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import {
  isValidDocument,
  PERSON_TYPES,
} from '../../../../shared/core/utils/document';
import {
  CUSTOMER_ADDRESS_TYPES,
  CUSTOMER_STAGES,
  type Customer,
} from '../entities/customer.entity';

const MAX_NOTES_LENGTH = 600;

export class CustomerZodValidator implements Validator<Customer> {
  private constructor() {}

  public static create(): CustomerZodValidator {
    return new CustomerZodValidator();
  }

  public validate(input: Customer): void {
    try {
      this.getSchema().parse(input.props);
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const message = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Customer ${input.props.name}: ${message}`,
          externalMessage: message,
          context: CustomerZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Customer: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do cliente',
        context: CustomerZodValidator.name,
      });
    }
  }

  private getSchema() {
    const addressSchema = z.object({
      id: z.string().uuid(),
      addressType: z.enum(CUSTOMER_ADDRESS_TYPES),
      zipCode: z
        .string()
        .regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
        .nullable(),
      street: z.string().trim().max(200).nullable(),
      number: z.string().trim().max(20).nullable(),
      district: z.string().trim().max(100).nullable(),
      city: z.string().trim().max(100).nullable(),
      state: z
        .string()
        .regex(/^[A-Z]{2}$/, 'UF deve ter 2 letras')
        .nullable(),
      complement: z.string().trim().max(100).nullable(),
    });

    return z
      .object({
        organizationId: z.string().uuid(),
        personType: z.enum(PERSON_TYPES),
        name: z.string().trim().min(2).max(200),
        document: z
          .string()
          .regex(/^\d+$/, 'deve conter apenas dígitos')
          .nullable(),
        rg: z.string().trim().max(30).nullable(),
        birthDate: z.date().nullable(),
        email: z.string().email().max(200).nullable(),
        mobilePhone: z.string().trim().min(8).max(20).nullable(),
        phone: z.string().trim().min(8).max(20).nullable(),
        additionalPhones: z.array(z.string().trim().min(8).max(20)),
        stage: z.enum(CUSTOMER_STAGES),
        categoryId: z.string().uuid().nullable(),
        notes: z.string().max(MAX_NOTES_LENGTH),
        addresses: z.array(addressSchema),
        branchIds: z.array(z.string().uuid()),
        deletedAt: z.date().nullable(),
        createdAt: z.date(),
        updatedAt: z.date(),
      })
      .refine(
        (data) =>
          data.document == null ||
          isValidDocument(data.personType, data.document),
        {
          path: ['document'],
          message: 'documento inválido para o tipo de pessoa informado',
        },
      )
      .refine(
        (data) =>
          data.addresses.filter((a) => a.addressType === 'principal').length <=
          1,
        {
          path: ['addresses'],
          message: 'só pode haver um endereço principal',
        },
      );
  }
}
