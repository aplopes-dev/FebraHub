import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseFaqAnswer } from './faq-answer';

describe('parseFaqAnswer', () => {
  it('splits paragraphs and bullet lists', () => {
    const blocks = parseFaqAnswer(
      'Introdução do tema.\n\n- Primeiro passo\n- Segundo passo\n\nFechamento.',
    );
    assert.deepEqual(blocks, [
      { type: 'paragraph', text: 'Introdução do tema.' },
      { type: 'list', items: ['Primeiro passo', 'Segundo passo'] },
      { type: 'paragraph', text: 'Fechamento.' },
    ]);
  });
});
