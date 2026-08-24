import type { ApiDocumentTemplateType } from '../../domain/mappers/document-template-enum.mapper';
import { DOCUMENT_TEMPLATE_TYPE_LABEL } from '../../domain/mappers/document-template-enum.mapper';

export type DefaultDocumentTemplateSeed = {
  nome: string;
  tipo: ApiDocumentTemplateType;
  conteudoHtml: string;
};

function wrap(title: string, body: string): string {
  return `<h1>${title}</h1>${body}<p>{{loja.nome}} — {{data.hoje}}</p>`;
}

export const DEFAULT_DOCUMENT_TEMPLATES: readonly DefaultDocumentTemplateSeed[] =
  [
    {
      tipo: 'termo-visita',
      nome: DOCUMENT_TEMPLATE_TYPE_LABEL['termo-visita'],
      conteudoHtml: wrap(
        'Termo de visita',
        `<p>Eu, <strong>{{lead.nome}}</strong>, declaro ter visitado o imóvel <strong>{{imovel.titulo}}</strong> no dia {{visita.data}} às {{visita.horario}}.</p>
<p>Endereço: {{imovel.endereco}}</p>
<p>Local informado: {{visita.local}}</p>
<p>Corretor responsável: {{corretor.nome}} (CRECI {{corretor.creci}}).</p>`,
      ),
    },
    {
      tipo: 'proposta-compra',
      nome: DOCUMENT_TEMPLATE_TYPE_LABEL['proposta-compra'],
      conteudoHtml: wrap(
        'Proposta de compra',
        `<p>Proponente: <strong>{{lead.nome}}</strong> — {{lead.telefone}} — {{lead.email}}</p>
<p>Imóvel: <strong>{{imovel.titulo}}</strong> ({{imovel.tipo}} / {{imovel.finalidade}})</p>
<p>Endereço: {{imovel.endereco}}</p>
<p>Valor proposto: <strong>{{negocio.valor}}</strong></p>
<p>Forma de pagamento: {{negocio.formaPagamento}}</p>
<p>Corretor: {{corretor.nome}} — CRECI {{corretor.creci}}</p>`,
      ),
    },
    {
      tipo: 'proposta-locacao',
      nome: DOCUMENT_TEMPLATE_TYPE_LABEL['proposta-locacao'],
      conteudoHtml: wrap(
        'Proposta de locação',
        `<p>Locatário: <strong>{{locacao.locatario}}</strong></p>
<p>Locador: {{locacao.locador}}</p>
<p>Imóvel: <strong>{{imovel.titulo}}</strong> — {{imovel.endereco}}</p>
<p>Aluguel proposto: <strong>{{locacao.aluguel}}</strong></p>
<p>Corretor: {{corretor.nome}} — CRECI {{corretor.creci}}</p>`,
      ),
    },
    {
      tipo: 'recibo-sinal',
      nome: DOCUMENT_TEMPLATE_TYPE_LABEL['recibo-sinal'],
      conteudoHtml: wrap(
        'Recibo de sinal',
        `<p>Recebemos de <strong>{{lead.nome}}</strong> o sinal referente ao {{negocio.tipo}} do imóvel <strong>{{imovel.titulo}}</strong>.</p>
<p>Valor: <strong>{{negocio.valor}}</strong> — {{negocio.formaPagamento}}</p>
<p>Endereço: {{imovel.endereco}}</p>
<p>Corretor: {{corretor.nome}} — CRECI {{corretor.creci}}</p>`,
      ),
    },
    {
      tipo: 'contrato-promessa-compra-venda',
      nome: DOCUMENT_TEMPLATE_TYPE_LABEL['contrato-promessa-compra-venda'],
      conteudoHtml: wrap(
        'Promessa de compra e venda',
        `<p>Pelo presente instrumento, <strong>{{lead.nome}}</strong> manifesta interesse na aquisição do imóvel <strong>{{imovel.titulo}}</strong>.</p>
<p>Endereço: {{imovel.endereco}}</p>
<p>Valor: <strong>{{imovel.preco}}</strong> ({{imovel.tipo}} / {{imovel.finalidade}})</p>
<p>Contato do comprador: {{lead.telefone}} — {{lead.email}}</p>
<p>Intermediação: {{corretor.nome}}, CRECI {{corretor.creci}}, telefone {{corretor.telefone}}.</p>
<p><em>Modelo esqueleto — revise as cláusulas com assessoria jurídica antes de usar em produção.</em></p>`,
      ),
    },
    {
      tipo: 'contrato-locacao',
      nome: DOCUMENT_TEMPLATE_TYPE_LABEL['contrato-locacao'],
      conteudoHtml: wrap(
        'Contrato de locação',
        `<p>Locador: <strong>{{locacao.locador}}</strong></p>
<p>Locatário: <strong>{{locacao.locatario}}</strong></p>
<p>Imóvel: <strong>{{imovel.titulo}}</strong> — {{imovel.endereco}}</p>
<p>Aluguel: <strong>{{locacao.aluguel}}</strong></p>
<p>Corretor: {{corretor.nome}} — CRECI {{corretor.creci}}</p>
<p><em>Modelo esqueleto — revise as cláusulas com assessoria jurídica antes de usar em produção.</em></p>`,
      ),
    },
    {
      tipo: 'outro',
      nome: 'Documento genérico',
      conteudoHtml: wrap(
        'Documento',
        `<p>Lead: {{lead.nome}}</p>
<p>Imóvel: {{imovel.titulo}}</p>
<p>Corretor: {{corretor.nome}}</p>`,
      ),
    },
  ];
