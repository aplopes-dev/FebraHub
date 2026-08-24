import { z } from 'zod';
import type { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import { isValidCpf } from '../../../../shared/core/utils/brazilian-document.utils';
import type { Patient } from '../entities/patient.entity';

const genderSchema = z.enum(['male', 'female', 'other']);
const statusSchema = z.enum(['active', 'inactive']);

function optionalCpf(value: string | null): boolean {
  if (!value) return true;
  return isValidCpf(value);
}

export class PatientZodValidator implements Validator<Patient> {
  private constructor() {}

  public static create(): PatientZodValidator {
    return new PatientZodValidator();
  }

  public validate(input: Patient): void {
    try {
      const schema = z
        .object({
          id: z.string().uuid(),
          storeId: z.string().min(1),
          status: statusSchema,
          name: z.string().min(1).max(200),
          cpf: z.string().length(11).nullable(),
          rg: z.string().max(30),
          birthDate: z.date().nullable(),
          gender: genderSchema,
          phone: z.string().max(20),
          landlinePhone: z.string().max(20),
          email: z.string().max(200),
          socialNetwork: z.string().max(200),
          medicalRecordNumber: z.string().max(60),
          referralOriginId: z.string().uuid().nullable(),
          referredByPatientId: z.string().uuid().nullable(),
          referredByMemberId: z.string().min(1).max(120).nullable(),
          referredByMemberName: z.string().max(200).nullable(),
          referredByExternalProfessionalId: z.string().uuid().nullable(),
          profession: z.string().max(120),
          categoryId: z.string().uuid(),
          guardianName: z.string().max(200),
          guardianBirthDate: z.date().nullable(),
          guardianCpf: z.string().length(11).nullable(),
          guardianPhone: z.string().max(20),
          guardianNotes: z.string().max(500),
          zipCode: z.string().max(12),
          street: z.string().max(200),
          streetNumber: z.string().max(20),
          complement: z.string().max(120),
          neighborhood: z.string().max(120),
          city: z.string().max(120),
          state: z.string().max(2),
          planId: z.string().min(1).nullable(),
          planNumber: z.string().max(60),
          planHolderName: z.string().max(200),
          planHolderCpf: z.string().length(11).nullable(),
          createdAt: z.date(),
          updatedAt: z.date(),
        })
        .superRefine((data, ctx) => {
          if (!optionalCpf(data.cpf)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'CPF inválido',
              path: ['cpf'],
            });
          }
          if (!optionalCpf(data.guardianCpf)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'CPF do responsável inválido',
              path: ['guardianCpf'],
            });
          }
          if (!optionalCpf(data.planHolderCpf)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'CPF do titular do plano inválido',
              path: ['planHolderCpf'],
            });
          }
        });

      schema.parse({
        id: input.id,
        storeId: input.props.storeId,
        status: input.props.status,
        name: input.props.name,
        cpf: input.props.cpf,
        rg: input.props.rg,
        birthDate: input.props.birthDate,
        gender: input.props.gender,
        phone: input.props.phone,
        landlinePhone: input.props.landlinePhone,
        email: input.props.email,
        socialNetwork: input.props.socialNetwork,
        medicalRecordNumber: input.props.medicalRecordNumber,
        referralOriginId: input.props.referralOriginId,
        referredByPatientId: input.props.referredByPatientId,
        referredByMemberId: input.props.referredByMemberId,
        referredByMemberName: input.props.referredByMemberName,
        referredByExternalProfessionalId:
          input.props.referredByExternalProfessionalId,
        profession: input.props.profession,
        categoryId: input.props.categoryId,
        guardianName: input.props.guardianName,
        guardianBirthDate: input.props.guardianBirthDate,
        guardianPhone: input.props.guardianPhone,
        guardianNotes: input.props.guardianNotes,
        guardianCpf: input.props.guardianCpf,
        zipCode: input.props.zipCode,
        street: input.props.street,
        streetNumber: input.props.streetNumber,
        complement: input.props.complement,
        neighborhood: input.props.neighborhood,
        city: input.props.city,
        state: input.props.state,
        planId: input.props.planId,
        planNumber: input.props.planNumber,
        planHolderName: input.props.planHolderName,
        planHolderCpf: input.props.planHolderCpf,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating Patient ${input.id}: ${msg}`,
          externalMessage: msg,
          context: PatientZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating Patient: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os dados do paciente',
        context: PatientZodValidator.name,
      });
    }
  }
}
