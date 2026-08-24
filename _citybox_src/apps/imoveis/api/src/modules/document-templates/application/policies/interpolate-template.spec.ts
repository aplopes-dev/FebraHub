import {
  emptyMergeSnapshot,
  type DocumentMergeSnapshot,
} from './document-variable-catalog';
import { interpolateTemplate } from './interpolate-template';

describe('interpolateTemplate', () => {
  it('substitui tags conhecidas e escapa HTML do valor', () => {
    const snapshot: DocumentMergeSnapshot = {
      ...emptyMergeSnapshot(),
      lead: {
        ...emptyMergeSnapshot().lead,
        nome: '<script>Ana</script>',
      },
    };

    const html = interpolateTemplate('<p>Olá {{lead.nome}}</p>', snapshot);

    expect(html).toContain('Olá');
    expect(html).not.toContain('<script>Ana</script>');
    expect(html).toContain('&lt;script&gt;Ana&lt;/script&gt;');
  });

  it('tag desconhecida vira string vazia', () => {
    const html = interpolateTemplate(
      'X{{lead.inexistente}}Y',
      emptyMergeSnapshot(),
    );
    expect(html).toBe('XY');
  });

  it('preserva HTML do modelo', () => {
    const snapshot: DocumentMergeSnapshot = {
      ...emptyMergeSnapshot(),
      loja: { nome: 'Imob Ilhéus' },
    };
    const html = interpolateTemplate(
      '<h1>{{loja.nome}}</h1><p>Contrato</p>',
      snapshot,
    );
    expect(html).toBe('<h1>Imob Ilhéus</h1><p>Contrato</p>');
  });
});
