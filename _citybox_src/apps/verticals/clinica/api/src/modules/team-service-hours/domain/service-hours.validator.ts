import { z } from 'zod';
import { ValidatorDomainError } from '../../../shared/core/errors/validator-domain.error';
import { ZodUtils } from '../../../shared/core/utils/zod-utils';
import { WEEKDAY_IDS, type ServiceHoursConfig } from './service-hours.types';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function isTimeBefore(start: string, end: string): boolean {
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  return startH * 60 + startM < endH * 60 + endM;
}

const weekdayScheduleSchema = z
  .object({
    enabled: z.boolean(),
    startTime: z.string().regex(TIME_REGEX, 'Horário inválido'),
    endTime: z.string().regex(TIME_REGEX, 'Horário inválido'),
  })
  .superRefine((day, ctx) => {
    if (day.enabled && !isTimeBefore(day.startTime, day.endTime)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Horário inicial deve ser anterior ao horário final',
        path: ['endTime'],
      });
    }
  });

const fixedLunchBreakSchema = z
  .object({
    enabled: z.boolean(),
    startTime: z.string().regex(TIME_REGEX, 'Horário inválido'),
    endTime: z.string().regex(TIME_REGEX, 'Horário inválido'),
  })
  .superRefine((lunch, ctx) => {
    if (!lunch.enabled) return;
    if (!isTimeBefore(lunch.startTime, lunch.endTime)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Início do almoço deve ser anterior ao fim',
        path: ['endTime'],
      });
    }
  });

const weekScheduleSchema = z.object(
  WEEKDAY_IDS.reduce(
    (shape, weekdayId) => ({
      ...shape,
      [weekdayId]: weekdayScheduleSchema,
    }),
    {} as Record<(typeof WEEKDAY_IDS)[number], typeof weekdayScheduleSchema>,
  ),
);

const serviceHoursSchema = z.object({
  weekSchedule: weekScheduleSchema,
  defaultConsultationMinutes: z
    .number()
    .int()
    .min(5)
    .max(240)
    .refine(
      (value) => value % 5 === 0,
      'Duração deve ser múltiplo de 5 minutos',
    ),
  fixedLunchBreak: fixedLunchBreakSchema,
});

export class ServiceHoursZodValidator {
  private constructor() {}

  static create(): ServiceHoursZodValidator {
    return new ServiceHoursZodValidator();
  }

  validate(input: ServiceHoursConfig): ServiceHoursConfig {
    try {
      return serviceHoursSchema.parse(input);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = ZodUtils.formatZodError(error);
        throw new ValidatorDomainError({
          internalMessage: `Error validating service hours: ${msg}`,
          externalMessage: msg,
          context: ServiceHoursZodValidator.name,
        });
      }
      const err = error as Error;
      throw new ValidatorDomainError({
        internalMessage: `Unexpected error validating service hours: ${err.message}`,
        externalMessage: 'Houve um erro ao validar os horários de atendimento',
        context: ServiceHoursZodValidator.name,
      });
    }
  }
}

export function parseMemberId(memberId: string): string {
  const result = z.string().uuid().safeParse(memberId);
  if (!result.success) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid memberId: ${memberId}`,
      externalMessage: 'Identificador do membro inválido',
      context: 'parseMemberId',
    });
  }
  return result.data;
}
