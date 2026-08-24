import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { ValidatorDomainError } from '../../../../../shared/core/errors/validator-domain.error';
import { DocumentTemplateEntity } from '../../../domain/entities/document-template.entity';
import {
  DocumentTemplateRepository,
  type ListDocumentTemplatesFilters,
} from '../../../domain/repositories/document-template.repository.interface';
import {
  isApiDocumentTemplateType,
  type ApiDocumentTemplateType,
} from '../../../domain/mappers/document-template-enum.mapper';

export type ListDocumentTemplatesInput = {
  storeId: string;
  page?: number;
  perPage?: number;
  search?: string;
  tipo?: string;
  ativo?: string | boolean;
};

export type ListDocumentTemplatesOutput = {
  items: DocumentTemplateEntity[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

function parseAtivo(value: string | boolean | undefined): boolean | undefined {
  if (value === undefined || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new Error(`Invalid ativo filter: ${value}`);
}

@Injectable()
export class ListDocumentTemplatesUseCase implements IUseCase<
  ListDocumentTemplatesInput,
  ListDocumentTemplatesOutput
> {
  constructor(private readonly templates: DocumentTemplateRepository) {}

  async execute(
    input: ListDocumentTemplatesInput,
  ): Promise<ListDocumentTemplatesOutput> {
    const page = Math.max(1, Number(input.page ?? 1) || 1);
    const perPage = Math.min(100, Math.max(1, Number(input.perPage ?? 20) || 20));

    let tipo: ApiDocumentTemplateType | undefined;
    let ativo: boolean | undefined;
    try {
      if (input.tipo?.trim()) {
        const trimmedTipo = input.tipo.trim();
        if (!isApiDocumentTemplateType(trimmedTipo)) {
          throw new Error(`Invalid tipo filter: ${input.tipo}`);
        }
        tipo = trimmedTipo;
      }
      ativo = parseAtivo(input.ativo);
    } catch (err) {
      throw new ValidatorDomainError({
        internalMessage: err instanceof Error ? err.message : 'Invalid filters',
        externalMessage: 'Filtros de listagem inválidos.',
        context: 'ListDocumentTemplatesUseCase',
      });
    }

    const filters: ListDocumentTemplatesFilters = {
      page,
      perPage,
      search: input.search?.trim() || undefined,
      tipo,
      ativo,
    };
    const { items, total } = await this.templates.findMany(
      input.storeId,
      filters,
    );
    return {
      items,
      total,
      page,
      perPage,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    };
  }
}
