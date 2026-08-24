import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { isValidCnpj } from '../../../../shared/core/utils/brazilian-document.utils';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import type { ClinicStoreProfile } from '../entities/clinic-store-profile.entity';

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const optionalValidCnpj = z
  .string()
  .max(20)
  .refine((value) => !value.trim() || isValidCnpj(value), {
    message: 'CNPJ inválido.',
  });

export class ClinicStoreProfileZodValidator implements Validator<ClinicStoreProfile> {
  private constructor() {}

  public static create(): ClinicStoreProfileZodValidator {
    return new ClinicStoreProfileZodValidator();
  }

  public validate(input: ClinicStoreProfile): void {
    try {
      this.getSchema().parse({
        id: input.id,
        storeId: input.props.storeId,
        clinicName: input.props.clinicName,
        cnpj: input.props.cnpj,
        communicationsName: input.props.communicationsName,
        responsible: input.props.responsible,
        logoObjectKey: input.props.logoObjectKey,
        logoMimeType: input.props.logoMimeType,
        openingTime: input.props.openingTime,
        closingTime: input.props.closingTime,
        email: input.props.email,
        phone: input.props.phone,
        mobile: input.props.mobile,
        cep: input.props.cep,
        street: input.props.street,
        number: input.props.number,
        complement: input.props.complement,
        neighborhood: input.props.neighborhood,
        city: input.props.city,
        state: input.props.state,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) {
        throw error;
      }
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating ClinicStoreProfile ${input.id}: ${msg}`,
          externalMessage: msg,
          context: ClinicStoreProfileZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating ClinicStoreProfile: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados da clínica',
        context: ClinicStoreProfileZodValidator.name,
      });
    }
  }

  private getSchema() {
    return z.object({
      id: z.string().min(1),
      storeId: z.string().min(1),
      clinicName: z.string().max(200),
      cnpj: optionalValidCnpj,
      communicationsName: z.string().max(200),
      responsible: z.string().max(200),
      logoObjectKey: z.string().max(512).nullable(),
      logoMimeType: z.string().max(64).nullable(),
      openingTime: z.string().regex(timePattern),
      closingTime: z.string().regex(timePattern),
      email: z.string().max(320),
      phone: z.string().max(20),
      mobile: z.string().max(20),
      cep: z.string().max(10),
      street: z.string().max(200),
      number: z.string().max(20),
      complement: z.string().max(100),
      neighborhood: z.string().max(100),
      city: z.string().max(100),
      state: z.string().max(2),
      createdAt: z.date(),
      updatedAt: z.date(),
    });
  }
}
