import { BadRequestException, Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import type {
  IndicacoesPeriodMode,
  IndicacoesReferrerKind,
  IndicacoesReferredPatientRow,
} from '../../../domain/indicacoes.types';
import { IndicacoesRepository } from '../../../domain/repositories/indicacoes.repository';
import { resolveIndicacoesPeriodRange } from '../../../domain/utils/resolve-indicacoes-period';

export type ListIndicacoesReferredPatientsInput = {
  storeId: string;
  periodMode: IndicacoesPeriodMode;
  year: number;
  month?: number;
  page?: number;
  perPage?: number;
  sortOrder?: 'asc' | 'desc';
  referrerKind?: IndicacoesReferrerKind;
  referrerId?: string;
};

export type ListIndicacoesReferredPatientsOutput = {
  items: IndicacoesReferredPatientRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListIndicacoesReferredPatientsUseCase
  implements
    IUseCase<
      ListIndicacoesReferredPatientsInput,
      ListIndicacoesReferredPatientsOutput
    >
{
  constructor(private readonly indicacoesRepository: IndicacoesRepository) {}

  async execute(
    input: ListIndicacoesReferredPatientsInput,
  ): Promise<ListIndicacoesReferredPatientsOutput> {
    if (input.periodMode === 'monthly' && input.month == null) {
      throw new BadRequestException(
        'month is required when periodMode is monthly',
      );
    }

    const hasReferrerKind = input.referrerKind != null;
    const hasReferrerId = Boolean(input.referrerId);
    if (hasReferrerKind !== hasReferrerId) {
      throw new BadRequestException(
        'referrerKind and referrerId must be provided together',
      );
    }

    const range = resolveIndicacoesPeriodRange({
      periodMode: input.periodMode,
      year: input.year,
      month: input.month,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const sortOrder = input.sortOrder ?? 'desc';
    const skip = (page - 1) * perPage;

    const result = await this.indicacoesRepository.listReferredPatients(
      input.storeId,
      {
        startDate: range.startDate,
        endDate: range.endDate,
        skip,
        take: perPage,
        sortOrder,
        referrerKind: input.referrerKind,
        referrerId: input.referrerId,
      },
    );

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
    };
  }
}
