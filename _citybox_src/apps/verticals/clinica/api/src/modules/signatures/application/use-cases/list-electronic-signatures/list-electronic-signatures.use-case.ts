import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import type {
  ElectronicSignatureKind,
  ElectronicSignatureStatus,
} from '../../../domain/entities/electronic-signature.entity';
import {
  ElectronicSignatureRepository,
  type ElectronicSignatureReportRow,
  type ElectronicSignatureReportStats,
} from '../../../domain/repositories/electronic-signature.repository.interface';

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

export type ListElectronicSignaturesInput = {
  storeId: string;
  startDate: string;
  endDate: string;
  kind?: ElectronicSignatureKind;
  /** Quando omitido ou vazio → lista pending+signed. */
  statuses?: ElectronicSignatureStatus[];
  page?: number;
  perPage?: number;
};

export type ListElectronicSignaturesOutput = {
  items: ElectronicSignatureReportRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  stats: ElectronicSignatureReportStats;
};

function assertCivilDateRange(input: {
  startDate: string;
  endDate: string;
}): { startDate: string; endDate: string } {
  if (!DATE_ONLY_RE.test(input.startDate) || !DATE_ONLY_RE.test(input.endDate)) {
    throw new ValidatorDomainError({
      internalMessage: `Invalid civil date range: ${input.startDate}..${input.endDate}`,
      externalMessage: 'Data inválida. Use o formato yyyy-MM-dd.',
      context: `startDate=${input.startDate};endDate=${input.endDate}`,
    });
  }

  if (input.endDate < input.startDate) {
    throw new ValidatorDomainError({
      internalMessage: `endDate before startDate: ${input.startDate}..${input.endDate}`,
      externalMessage: 'A data final deve ser maior ou igual à data inicial.',
      context: `startDate=${input.startDate};endDate=${input.endDate}`,
    });
  }

  return { startDate: input.startDate, endDate: input.endDate };
}

@Injectable()
export class ListElectronicSignaturesUseCase
  implements
    IUseCase<ListElectronicSignaturesInput, ListElectronicSignaturesOutput>
{
  constructor(
    private readonly signatureRepository: ElectronicSignatureRepository,
  ) {}

  async execute(
    input: ListElectronicSignaturesInput,
  ): Promise<ListElectronicSignaturesOutput> {
    const range = assertCivilDateRange({
      startDate: input.startDate,
      endDate: input.endDate,
    });

    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;
    const skip = (page - 1) * perPage;

    const statuses =
      input.statuses && input.statuses.length > 0
        ? input.statuses
        : (['pending', 'signed'] as ElectronicSignatureStatus[]);

    const result = await this.signatureRepository.findManyForReport(
      input.storeId,
      {
        startDate: range.startDate,
        endDate: range.endDate,
        kinds: input.kind ? [input.kind] : undefined,
        statuses,
        skip,
        take: perPage,
      },
    );

    return {
      items: result.items,
      total: result.total,
      page,
      perPage,
      totalPages: Math.ceil(result.total / perPage) || 0,
      stats: result.stats,
    };
  }
}
