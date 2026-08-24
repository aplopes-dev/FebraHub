import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import {
  InvoiceRepository,
  type InvoicesStats,
} from '../../../domain/repositories/invoice.repository.interface';
import type { InvoiceStatus } from '../../../domain/entities/invoice.entity';

export interface GetInvoicesStatsDto {
  storeId?: string;
  subscriptionId?: string;
  status?: string[];
  method?: string[];
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

const VALID_STATUS: InvoiceStatus[] = [
  'DRAFT',
  'OPEN',
  'PAID',
  'PAST_DUE',
  'VOID',
];

@Injectable()
export class GetInvoicesStatsUseCase implements IUseCase<
  GetInvoicesStatsDto,
  InvoicesStats
> {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(dto: GetInvoicesStatsDto): Promise<InvoicesStats> {
    const parsedStatus = this.normalizeStatus(dto.status);
    const parsedDueDateFrom = dto.dueDateFrom
      ? new Date(dto.dueDateFrom)
      : undefined;
    const parsedDueDateTo = dto.dueDateTo ? new Date(dto.dueDateTo) : undefined;

    return this.invoiceRepository.getStats({
      // `storeId` não era repassado antes (o antigo `clientId` chegava no DTO e era
      // descartado aqui), então filtrar por loja devolvia as estatísticas de todas.
      storeId: dto.storeId,
      subscriptionId: dto.subscriptionId,
      status: parsedStatus,
      method: dto.method,
      search: dto.search,
      dueDateFrom: parsedDueDateFrom,
      dueDateTo: parsedDueDateTo,
    });
  }

  private normalizeStatus(status?: string[]): InvoiceStatus[] | undefined {
    if (!status?.length) return undefined;
    const valid = status
      .map((s) => s.toUpperCase())
      .filter((s): s is InvoiceStatus =>
        VALID_STATUS.includes(s as InvoiceStatus),
      );
    return valid.length ? valid : undefined;
  }
}
