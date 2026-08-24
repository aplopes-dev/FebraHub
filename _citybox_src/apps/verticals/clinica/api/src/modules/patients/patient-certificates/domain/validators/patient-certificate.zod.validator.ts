import { z } from 'zod';
import type { Validator } from '../../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import type { PatientCertificate } from '../entities/patient-certificate.entity';

const typeSchema = z.enum(['days', 'attendance']);
const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);

const baseFields = {
  id: z.string().uuid(),
  storeId: z.string().min(1),
  patientId: z.string().uuid(),
  professionalId: z.string().min(1),
  professionalName: z.string().min(1),
  patientName: z.string().min(1),
  clinicName: z.string().nullable(),
  councilType: z.enum(['CRM', 'CRO', 'CREFITO']).nullable().optional(),
  councilNumber: z.string().nullable().optional(),
  councilUf: z.string().nullable().optional(),
  issuedDate: z.date(),
  issuedAt: z.date(),
  cid: z.string().nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
};

const daysCertificateSchema = z.object({
  ...baseFields,
  type: z.literal('days'),
  daysCount: z.string().min(1),
  startTime: z.null().optional(),
  endTime: z.null().optional(),
});

const attendanceCertificateSchema = z
  .object({
    ...baseFields,
    type: z.literal('attendance'),
    startTime: timeSchema,
    endTime: timeSchema,
    daysCount: z.null().optional(),
  })
  .refine((value) => value.endTime > value.startTime, {
    message: 'A hora final deve ser posterior à hora inicial',
    path: ['endTime'],
  });

const certificateSchema = z.discriminatedUnion('type', [
  daysCertificateSchema,
  attendanceCertificateSchema,
]);

export class PatientCertificateZodValidator implements Validator<PatientCertificate> {
  private constructor() {}

  public static create(): PatientCertificateZodValidator {
    return new PatientCertificateZodValidator();
  }

  public validate(input: PatientCertificate): void {
    try {
      certificateSchema.parse({
        id: input.id,
        storeId: input.props.storeId,
        patientId: input.props.patientId,
        professionalId: input.props.professionalId,
        professionalName: input.props.professionalName,
        patientName: input.props.patientName,
        clinicName: input.props.clinicName,
        councilType: input.props.councilType,
        councilNumber: input.props.councilNumber,
        councilUf: input.props.councilUf,
        type: input.props.type,
        issuedDate: input.props.issuedDate,
        issuedAt: input.props.issuedAt,
        daysCount: input.props.daysCount,
        startTime: input.props.startTime,
        endTime: input.props.endTime,
        cid: input.props.cid,
        createdAt: input.props.createdAt,
        updatedAt: input.props.updatedAt,
      });
    } catch (error) {
      if (error instanceof ValidatorDomainError) throw error;
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating PatientCertificate ${input.id}: ${msg}`,
          externalMessage: msg,
          context: PatientCertificateZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating PatientCertificate: ${err.message}`,
        externalMessage: 'Houve um erro ao validar o atestado',
        context: PatientCertificateZodValidator.name,
      });
    }
  }
}
