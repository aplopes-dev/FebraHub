import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import { DocumentTemplateEntity } from '../../../domain/entities/document-template.entity';
import { DocumentTemplateRepository } from '../../../domain/repositories/document-template.repository.interface';
import { DEFAULT_TEMPLATE_SKELETONS } from '../../policies/default-template-html';

@Injectable()
export class SeedDefaultDocumentTemplatesUseCase implements IUseCase<
  { storeId: string },
  DocumentTemplateEntity[]
> {
  constructor(private readonly templates: DocumentTemplateRepository) {}

  async execute(input: { storeId: string }): Promise<DocumentTemplateEntity[]> {
    const created: DocumentTemplateEntity[] = [];
    for (const [tipo, skeleton] of Object.entries(DEFAULT_TEMPLATE_SKELETONS)) {
      if (!skeleton) continue;
      const existing = await this.templates.listActiveByTypes(input.storeId, [
        tipo as DocumentTemplateEntity['tipo'],
      ]);
      const anyOfType = await this.templates.findMany(input.storeId, {
        page: 1,
        perPage: 1,
        tipo: tipo as DocumentTemplateEntity['tipo'],
      });
      if (anyOfType.total > 0 || existing.length > 0) continue;
      const template = await this.templates.create({
        storeId: input.storeId,
        nome: skeleton.nome,
        tipo: tipo as DocumentTemplateEntity['tipo'],
        conteudoHtml: skeleton.html,
        ativo: true,
        isDefault: true,
      });
      created.push(template);
    }
    return created;
  }
}
