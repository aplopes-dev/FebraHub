import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { filterTemplatesBySurface } from './filter-templates-by-surface';
import type { DocumentTemplate } from '../types';

function tpl(
  id: string,
  tipo: DocumentTemplate['tipo'],
  ativo = true,
): DocumentTemplate {
  return {
    id,
    nome: id,
    tipo,
    tipoLabel: tipo,
    conteudoHtml: '<p></p>',
    ativo,
    isDefault: false,
    createdAt: '',
    updatedAt: '',
  };
}

describe('filterTemplatesBySurface', () => {
  const items = [
    tpl('cpcv', 'contrato-promessa-compra-venda'),
    tpl('visita', 'termo-visita'),
    tpl('recibo', 'recibo-sinal'),
    tpl('proposta', 'proposta-compra'),
    tpl('locacao', 'proposta-locacao'),
    tpl('off', 'outro', false),
  ];

  it('na ficha do lead só contratos e outro ativos', () => {
    const result = filterTemplatesBySurface(items, 'lead');
    assert.deepEqual(
      result.map((t) => t.id),
      ['cpcv'],
    );
  });

  it('na agenda só termo de visita', () => {
    const result = filterTemplatesBySurface(items, 'appointment');
    assert.deepEqual(
      result.map((t) => t.id),
      ['visita'],
    );
  });

  it('na venda filtra recibo e proposta de compra', () => {
    const result = filterTemplatesBySurface(items, 'transaction-sale');
    assert.deepEqual(
      result.map((t) => t.id),
      ['recibo', 'proposta'],
    );
  });
});
