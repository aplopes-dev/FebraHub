import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildWhatsAppPropertyHref,
  buildWhatsAppPropertyMessageText,
} from '../utils/whatsapp-property-message';
import { buildCatalogWhatsAppMessage } from './catalog-whatsapp-button';

describe('buildWhatsAppPropertyMessageText', () => {
  it('mensagem simplificada: título + link sem Ref, emojis ou rota interna', () => {
    const msg = buildWhatsAppPropertyMessageText({
      propertyTitle: 'Apto Centro',
      propertyId: 'prop-1',
    });
    assert.match(msg, /^Olá! Tenho interesse no imóvel \*Apto Centro\*\.\n\n/);
    assert.match(msg, /Link do imóvel:\nhttps?:\/\/.+\/p\/prop-1\?action=new-lead$/);
    assert.doesNotMatch(msg, /Ref:/i);
    assert.doesNotMatch(msg, /[\u{1F300}-\u{1FAFF}]/u);
    assert.doesNotMatch(msg, /\/leads\/new/);
  });

  it('href aplica encodeURIComponent uma vez (\\n → %0A) e DDI 55', () => {
    const expectedText = buildWhatsAppPropertyMessageText({
      propertyTitle: 'Casa Azul',
      propertyId: 'id-9',
    });
    const href = buildWhatsAppPropertyHref({
      phone: '11987654321',
      propertyTitle: 'Casa Azul',
      propertyId: 'id-9',
    });
    assert.ok(href);
    assert.match(href!, /^https:\/\/wa\.me\/5511987654321\?text=/);
    const textParam = href!.split('?text=')[1] ?? '';
    assert.ok(textParam.includes('%0A'), 'quebra de linha deve ser %0A no query');
    assert.equal(decodeURIComponent(textParam), expectedText);
    assert.doesNotMatch(expectedText, /Ref:/i);
  });
});

describe('buildCatalogWhatsAppMessage (compat)', () => {
  it('mensagem geral sem imóvel', () => {
    const msg = buildCatalogWhatsAppMessage();
    assert.match(msg, /perfil da imobiliária/i);
  });
});
