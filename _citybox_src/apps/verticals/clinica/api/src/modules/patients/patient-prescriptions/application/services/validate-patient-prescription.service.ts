import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../../shared/core/utils/zod-utils';
import { PRESCRIPTION_MEASURES } from '../../domain/entities/patient-prescription.entity';
import type { UpsertPatientPrescriptionInput } from '../dtos/patient-prescription.dto';

const prescriptionItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1),
  quantity: z.string().trim().min(1),
  measure: z.enum(PRESCRIPTION_MEASURES),
  posology: z.string(),
  notes: z.string(),
});

const upsertSchema = z.object({
  professionalId: z.string().trim().min(1),
  professionalName: z.string().trim().min(1),
  clinicName: z.string().trim().nullable().optional(),
  issuedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)'),
  items: z
    .array(prescriptionItemSchema)
    .min(1, 'Adicione ao menos um medicamento'),
});

@Injectable()
export class ValidatePatientPrescriptionService {
  execute(context: string, input: UpsertPatientPrescriptionInput): void {
    try {
      upsertSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Invalid patient prescription input: ${msg}`,
          externalMessage: msg,
          context,
        });
      }
      throw error;
    }
  }
}
