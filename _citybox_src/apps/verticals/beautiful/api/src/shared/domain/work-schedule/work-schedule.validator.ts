import { z } from 'zod';
import { ValidatorDomainError } from '../../core/errors/validator-domain.error';
import { ZodUtils } from '../../core/utils/zod-utils';
import {
  WEEKDAY_IDS,
  type WeekSchedule,
  type WorkInterval,
} from './work-schedule.types';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const MAX_INTERVALS_PER_DAY = 5;

const intervalSchema = z.object({
  startTime: z
    .string()
    .regex(TIME_REGEX, 'Horário deve estar no formato HH:mm'),
  endTime: z.string().regex(TIME_REGEX, 'Horário deve estar no formato HH:mm'),
});

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function assertNoOverlaps(weekday: string, intervals: WorkInterval[]): void {
  const sorted = [...intervals].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (timeToMinutes(current.startTime) >= timeToMinutes(current.endTime)) {
      throw new ValidatorDomainError({
        internalMessage: `Invalid interval on ${weekday}: ${current.startTime}-${current.endTime}`,
        externalMessage: `No dia ${weekday}, o horário de início deve ser anterior ao de término.`,
        context: 'WorkScheduleValidator',
      });
    }
    if (i > 0) {
      const previous = sorted[i - 1];
      if (timeToMinutes(current.startTime) < timeToMinutes(previous.endTime)) {
        throw new ValidatorDomainError({
          internalMessage: `Overlapping intervals on ${weekday}`,
          externalMessage: `No dia ${weekday}, os intervalos de horário não podem se sobrepor.`,
          context: 'WorkScheduleValidator',
        });
      }
    }
  }
}

export function validateWeekSchedule(week: WeekSchedule): void {
  const shape = Object.fromEntries(
    WEEKDAY_IDS.map((id) => [
      id,
      z
        .array(intervalSchema)
        .max(
          MAX_INTERVALS_PER_DAY,
          `No máximo ${MAX_INTERVALS_PER_DAY} intervalos por dia`,
        ),
    ]),
  );

  const result = z.object(shape).safeParse(week);
  if (!result.success) {
    const message = ZodUtils.formatZodError(result.error);
    throw new ValidatorDomainError({
      internalMessage: `Work schedule validation failed: ${message}`,
      externalMessage: message,
      context: 'WorkScheduleValidator',
    });
  }

  for (const weekday of WEEKDAY_IDS) {
    assertNoOverlaps(weekday, week[weekday]);
  }
}
