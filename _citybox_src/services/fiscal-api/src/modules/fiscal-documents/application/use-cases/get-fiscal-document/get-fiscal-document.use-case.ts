import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../domain/repositories/fiscal-document.repository.interface';
import { FiscalDocument } from '../../../domain/entities/fiscal-document.entity';
import { FiscalDocumentNotFoundError } from '../../../domain/errors/fiscal-document-not-found.error';
import type { GetFiscalDocumentDto } from '../../dtos/fiscal-document.dto';

@Injectable()
export class GetFiscalDocumentUseCase implements IUseCase<
  GetFiscalDocumentDto,
  FiscalDocument
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
  ) {}

  async execute(dto: GetFiscalDocumentDto): Promise<FiscalDocument> {
    const document = await this.fiscalDocumentRepository.findById(
      dto.fiscalDocumentId,
    );
    if (!document) {
      throw new FiscalDocumentNotFoundError(
        GetFiscalDocumentUseCase.name,
        dto.fiscalDocumentId,
      );
    }
    return document;
  }
}
