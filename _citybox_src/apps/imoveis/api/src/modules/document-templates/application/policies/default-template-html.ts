import type { ApiDocumentTemplateType } from '../../domain/mappers/document-template-enum.mapper';
import { DOCUMENT_TEMPLATE_TYPE_LABEL } from '../../domain/mappers/document-template-enum.mapper';

const HEADER = `<h1>{{loja.nome}}</h1>
<p>{{data.hoje}}</p>`;

const FOOTER = `<p>Corretor: {{corretor.nome}} — CRECI {{corretor.creci}}</p>
<p>Telefone: {{corretor.telefone}}</p>`;

export const DEFAULT_TEMPLATE_SKELETONS: Partial<
  Record<ApiDocumentTemplateType, { nome: string; html: string }>
> = {
  'termo-visita': {
    nome: DOCUMENT_TEMPLATE_TYPE_LABEL['termo-visita'],
    html: `${HEADER}
<h2>Termo de visita</h2>
<p>Lead: <strong>{{lead.nome}}</strong> — {{lead.telefone}}</p>
<p>Imóvel: {{imovel.titulo}}</p>
<p>Endereço: {{imovel.endereco}}</p>
<p>Data: {{visita.data}} às {{visita.horario}}</p>
<p>Local: {{visita.local}}</p>
${FOOTER}`,
  },
  'recibo-sinal': {
    nome: DOCUMENT_TEMPLATE_TYPE_LABEL['recibo-sinal'],
    html: `${HEADER}
<h2>Recibo de sinal</h2>
<p>Recebemos de <strong>{{lead.nome}}</strong> o valor de {{negocio.valor}} referente ao sinal do negócio de {{negocio.tipo}} do imóvel {{imovel.titulo}}.</p>
<p>Forma de pagamento: {{negocio.formaPagamento}}</p>
${FOOTER}`,
  },
  'proposta-compra': {
    nome: DOCUMENT_TEMPLATE_TYPE_LABEL['proposta-compra'],
    html: `${HEADER}
<h2>Proposta de compra</h2>
<p>Proponente: <strong>{{lead.nome}}</strong> ({{lead.email}} / {{lead.telefone}})</p>
<p>Imóvel: {{imovel.titulo}} — {{imovel.endereco}}</p>
<p>Valor proposto: {{negocio.valor}}</p>
<p>Forma de pagamento: {{negocio.formaPagamento}}</p>
${FOOTER}`,
  },
  'proposta-locacao': {
    nome: DOCUMENT_TEMPLATE_TYPE_LABEL['proposta-locacao'],
    html: `${HEADER}
<h2>Proposta de locação</h2>
<p>Locatário: <strong>{{locacao.locatario}}</strong></p>
<p>Locador: {{locacao.locador}}</p>
<p>Imóvel: {{imovel.titulo}} — {{imovel.endereco}}</p>
<p>Aluguel: {{locacao.aluguel}}</p>
${FOOTER}`,
  },
  'contrato-promessa-compra-venda': {
    nome: DOCUMENT_TEMPLATE_TYPE_LABEL['contrato-promessa-compra-venda'],
    html: `${HEADER}
<h2>Promessa de compra e venda</h2>
<p>Comprador: <strong>{{lead.nome}}</strong>, {{lead.cidade}}</p>
<p>Imóvel: {{imovel.titulo}} ({{imovel.tipo}} / {{imovel.finalidade}})</p>
<p>Endereço: {{imovel.endereco}}</p>
<p>Preço: {{imovel.preco}}</p>
<p>Este é um esqueleto — complete as cláusulas no editor de modelos.</p>
${FOOTER}`,
  },
  'contrato-locacao': {
    nome: DOCUMENT_TEMPLATE_TYPE_LABEL['contrato-locacao'],
    html: `${HEADER}
<h2>Contrato de locação</h2>
<p>Locador: {{locacao.locador}}</p>
<p>Locatário: {{locacao.locatario}}</p>
<p>Imóvel: {{imovel.titulo}} — {{imovel.endereco}}</p>
<p>Aluguel: {{locacao.aluguel}}</p>
<p>Este é um esqueleto — complete as cláusulas no editor de modelos.</p>
${FOOTER}`,
  },
};
