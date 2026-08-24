import type { DocumentTemplateEntity } from '../../../../domain/entities/document-template.entity';
import { DOCUMENT_TEMPLATE_TYPE_LABEL } from '../../../../domain/mappers/document-template-enum.mapper';

export function mapDocumentTemplateToHttp(template: DocumentTemplateEntity) {
  return {
    id: template.id,
    nome: template.nome,
    tipo: template.tipo,
    tipoLabel: DOCUMENT_TEMPLATE_TYPE_LABEL[template.tipo],
    conteudoHtml: template.conteudoHtml,
    ativo: template.ativo,
    isDefault: template.isDefault,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
