import { z } from 'zod';
import { Validator } from '../../../../shared/domain/validators/validator.interface';
import { ValidatorDomainError } from '../../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../../shared/core/utils/zod-utils';
import { AppointmentProps } from '../entities/appointment.entity';
import { APPOINTMENT_STATUSES } from '../appointment.types';

export class AppointmentZodValidator implements Validator<AppointmentProps> {
  private schema = z
    .object({
      storeId: z.uuid(),
      clientId: z.string().uuid('ID do cliente inválido'),
      categoryId: z
        .string()
        .uuid('ID da categoria inválido')
        .nullable()
        .optional(),
      clientNotes: z.string().nullable().optional(),
      startAt: z.date(),
      endAt: z.date(),
      status: z.enum(APPOINTMENT_STATUSES),
      totalPrice: z.number().nonnegative('O valor total não pode ser negativo'),
      services: z
        .array(
          z.object({
            id: z.string().uuid().optional(),
            professionalId: z.string().uuid('ID do profissional inválido'),
            professionalName: z.string().optional(),
            serviceId: z.string().uuid('ID do serviço inválido'),
            serviceName: z.string().optional(),
            price: z.number().nonnegative(),
            duration: z.number().int().positive('Duração deve ser positiva'),
          }),
        )
        .min(1, 'Informe ao menos um serviço no agendamento'),
    })
    .refine((data) => data.endAt.getTime() > data.startAt.getTime(), {
      message: 'O horário de término deve ser após o início',
      path: ['endAt'],
    });

  validate(input: AppointmentProps): void {
    const result = this.schema.safeParse(input);
    if (!result.success) {
      const message = ZodUtils.formatZodError(result.error);
      throw new ValidatorDomainError({
        internalMessage: `Appointment validation failed: ${message}`,
        externalMessage: message,
        context: 'AppointmentValidator',
      });
    }
  }
}
