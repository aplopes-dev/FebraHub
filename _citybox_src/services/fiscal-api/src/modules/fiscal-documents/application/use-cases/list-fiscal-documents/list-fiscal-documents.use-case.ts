import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { FiscalDocumentRepository } from '../../../domain/repositories/fiscal-document.repository.interface';
import type { FiscalDocument } from '../../../domain/entities/fiscal-document.entity';
import type { ListFiscalDocumentsDto } from '../../dtos/fiscal-document.dto';

export type ListFiscalDocumentsResult = {
  documents: FiscalDocument[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

@Injectable()
export class ListFiscalDocumentsUseCase implements IUseCase<
  ListFiscalDocumentsDto,
  ListFiscalDocumentsResult
> {
  constructor(
    private readonly fiscalDocumentRepository: FiscalDocumentRepository,
  ) {}

  async execute({
    page = 1,
    perPage = 20,
    ...filters
  }: ListFiscalDocumentsDto): Promise<ListFiscalDocumentsResult> {
    const skip = (page - 1) * perPage;

    const [documents, total] = await Promise.all([
      this.fiscalDocumentRepository.findAll({
        ...filters,
        skip,
        take: perPage,
      }),
      this.fiscalDocumentRepository.count(filters),
    ]);

    return {
      documents,
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage) || 0,
    };
  }
}
