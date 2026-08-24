import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DocumentTemplateEntity } from '../../../domain/entities/document-template.entity';
import { DocumentTemplateRepository } from '../../../domain/repositories/document-template.repository.interface';
import type { ApiDocumentTemplateType } from '../../../domain/mappers/document-template-enum.mapper';

export type CreateDocumentTemplateInput = {
  storeId: string;
  nome: string;
  tipo: ApiDocumentTemplateType;
  conteudoHtml: string;
  ativo?: boolean;
  isDefault?: boolean;
};

@Injectable()
export class CreateDocumentTemplateUseCase implements IUseCase<
  CreateDocumentTemplateInput,
  DocumentTemplateEntity
> {
  constructor(private readonly templates: DocumentTemplateRepository) {}

  async execute(
    input: CreateDocumentTemplateInput,
  ): Promise<DocumentTemplateEntity> {
    return this.templates.create({
      storeId: input.storeId,
      nome: input.nome,
      tipo: input.tipo,
      conteudoHtml: input.conteudoHtml,
      ativo: input.ativo,
      isDefault: input.isDefault,
    });
  }
}
