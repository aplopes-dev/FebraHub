import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../generated/prisma/client';
import { PrismaService } from '../../../shared/infra/prisma/prisma.service';
import {
  WEEKDAY_IDS,
  type ServiceHoursConfig,
  type WeekdayId,
} from '../domain/service-hours.types';
import { ProfessionalServiceHoursRepository } from '../domain/professional-service-hours.repository';

type WeekScheduleRow = Record<
  string,
  { enabled: boolean; startTime: string; endTime: string }
>;

@Injectable()
export class PrismaProfessionalServiceHoursRepository extends ProfessionalServiceHoursRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByMember(
    storeId: string,
    memberId: string,
  ): Promise<ServiceHoursConfig | null> {
    const row = await this.prisma.professionalServiceHours.findUnique({
      where: { storeId_memberId: { storeId, memberId } },
    });
    return row ? this.toConfig(row) : null;
  }

  async upsert(
    storeId: string,
    memberId: string,
    config: ServiceHoursConfig,
  ): Promise<ServiceHoursConfig> {
    const row = await this.prisma.professionalServiceHours.upsert({
      where: { storeId_memberId: { storeId, memberId } },
      create: {
        storeId,
        memberId,
        defaultConsultationMinutes: config.defaultConsultationMinutes,
        fixedLunchBreakEnabled: config.fixedLunchBreak.enabled,
        lunchBreakStart: config.fixedLunchBreak.enabled
          ? config.fixedLunchBreak.startTime
          : null,
        lunchBreakEnd: config.fixedLunchBreak.enabled
          ? config.fixedLunchBreak.endTime
          : null,
        weekSchedule: config.weekSchedule,
      },
      update: {
        defaultConsultationMinutes: config.defaultConsultationMinutes,
        fixedLunchBreakEnabled: config.fixedLunchBreak.enabled,
        lunchBreakStart: config.fixedLunchBreak.enabled
          ? config.fixedLunchBreak.startTime
          : null,
        lunchBreakEnd: config.fixedLunchBreak.enabled
          ? config.fixedLunchBreak.endTime
          : null,
        weekSchedule: config.weekSchedule,
      },
    });

    return this.toConfig(row);
  }

  private toConfig(row: {
    defaultConsultationMinutes: number;
    fixedLunchBreakEnabled: boolean;
    lunchBreakStart: string | null;
    lunchBreakEnd: string | null;
    weekSchedule: unknown;
  }): ServiceHoursConfig {
    const weekScheduleRaw = row.weekSchedule as WeekScheduleRow;
    const weekSchedule = WEEKDAY_IDS.reduce(
      (acc, weekdayId) => {
        const day = weekScheduleRaw[weekdayId];
        acc[weekdayId] = {
          enabled: day?.enabled ?? false,
          startTime: day?.startTime ?? '08:00',
          endTime: day?.endTime ?? '18:00',
        };
        return acc;
      },
      {} as Record<WeekdayId, ServiceHoursConfig['weekSchedule'][WeekdayId]>,
    );

    return {
      weekSchedule,
      defaultConsultationMinutes: row.defaultConsultationMinutes,
      fixedLunchBreak: {
        enabled: row.fixedLunchBreakEnabled,
        startTime: row.lunchBreakStart ?? '12:00',
        endTime: row.lunchBreakEnd ?? '13:00',
      },
    };
  }
}
