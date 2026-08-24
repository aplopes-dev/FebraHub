import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../domain/repositories/fiscal-document.repository.interface';
import { FiscalEventRepository } from '../../../domain/repositories/fiscal-event.repository.interface';
import type { FiscalEvent } from '../../../domain/entities/fiscal-event.entity';
import { FiscalDocumentNotFoundError } from '../../../domain/errors/fiscal-document-not-found.error';
import type { ListFiscalDocumentEventsDto } from '../../dtos/fiscal-document.dto';

@Injectable()
export class ListFiscalDocumentEventsUseCase implements IUseCase<
  ListFiscalDocumentEventsDto,
  FiscalEvent[]
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
    private readonly fiscalEventRepository: FiscalEventRepository,
  ) {}

  async execute(dto: ListFiscalDocumentEventsDto): Promise<FiscalEvent[]> {
    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        ListFiscalDocumentEventsUseCase.name,
        dto.fiscalDocumentId,
      );
    }
    return this.fiscalEventRepository.findByFiscalDocumentId(
      dto.fiscalDocumentId,
    );
  }
}
