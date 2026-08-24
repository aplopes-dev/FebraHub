import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { PatientRepository } from '../../../../patients/domain/repositories/patient.repository.interface';
import { toIsoDateOnly } from '../../../../financial/entries/application/utils/financial-entry.utils';
import {
  buildBirthdayRelativeLabel,
  buildPastBirthdayRelativeLabel,
  calculateAgeYears,
  daysSinceLastBirthday,
  daysUntilNextBirthday,
  isBirthdayInRange,
  isPastLookingBirthdayPeriod,
  parseIsoDateOnly,
  resolveBirthdayPeriodRange,
  type BirthdayPeriod,
} from '../../../../patients/domain/utils/birthday-window.utils';
import { formatDateOnly } from '../../../../patients/application/mappers/patient-form.mapper';

export type ListDashboardBirthdaysDto = {
  storeId: string;
  period?: BirthdayPeriod;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
  search?: string;
  /** Optional clock for tests; defaults to now. */
  now?: Date;
};

export type DashboardBirthdayItem = {
  id: string;
  name: string;
  phone: string;
  birthDate: string;
  photoUrl: string | null;
  ageYears: number;
  daysUntil: number;
  relativeLabel: string;
};

export type ListDashboardBirthdaysResult = {
  items: DashboardBirthdayItem[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListDashboardBirthdaysUseCase
  implements IUseCase<ListDashboardBirthdaysDto, ListDashboardBirthdaysResult>
{
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(
    dto: ListDashboardBirthdaysDto,
  ): Promise<ListDashboardBirthdaysResult> {
    const period = dto.period ?? 'next_30_days';
    const page = dto.page ?? 1;
    const perPage = dto.perPage ?? 20;
    const todayIsoDate = toIsoDateOnly(dto.now ?? new Date());
    const today = parseIsoDateOnly(todayIsoDate);

    if (period === 'custom') {
      if (!dto.startDate?.trim() || !dto.endDate?.trim()) {
        throw new BadRequestException(
          'startDate e endDate são obrigatórios para período custom.',
        );
      }
      if (parseIsoDateOnly(dto.endDate) < parseIsoDateOnly(dto.startDate)) {
        throw new BadRequestException(
          'endDate deve ser maior ou igual a startDate.',
        );
      }
    }

    const range = resolveBirthdayPeriodRange(
      period,
      todayIsoDate,
      dto.startDate,
      dto.endDate,
    );
    const pastLooking = isPastLookingBirthdayPeriod(
      period,
      range,
      todayIsoDate,
    );

    const candidates = await this.patientRepository.findActiveWithBirthDate(
      dto.storeId,
      dto.search,
    );

    const enriched = candidates
      .filter((patient) =>
        isBirthdayInRange(
          patient.birthDate,
          range.startIsoDate,
          range.endIsoDate,
        ),
      )
      .map((patient) => {
        const ageYears = calculateAgeYears(patient.birthDate, today);
        const daysUntil = daysUntilNextBirthday(patient.birthDate, today);
        const daysSince = daysSinceLastBirthday(patient.birthDate, today);
        const relativeLabel = pastLooking
          ? buildPastBirthdayRelativeLabel(daysSince, ageYears)
          : buildBirthdayRelativeLabel(daysUntil, ageYears);

        return {
          id: patient.id,
          name: patient.name,
          phone: patient.phone,
          birthDate: formatDateOnly(patient.birthDate),
          photoUrl: patient.photoObjectKey
            ? `/api/v1/patients/${patient.id}/photo`
            : null,
          ageYears,
          daysUntil: pastLooking ? -daysSince : daysUntil,
          relativeLabel,
        } satisfies DashboardBirthdayItem;
      })
      .sort((a, b) => {
        if (pastLooking) {
          return Math.abs(a.daysUntil) - Math.abs(b.daysUntil);
        }
        return a.daysUntil - b.daysUntil;
      });

    const total = enriched.length;
    const skip = (page - 1) * perPage;
    const items = enriched.slice(skip, skip + perPage);

    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
