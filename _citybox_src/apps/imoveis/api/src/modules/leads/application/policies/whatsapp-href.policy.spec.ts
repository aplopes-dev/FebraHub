import {
  buildLeadDocumentWhatsAppMessage,
  whatsAppHref,
} from './whatsapp-href.policy';

describe('whatsapp-href.policy', () => {
  it('prefixa 55 em número local BR', () => {
    const href = whatsAppHref('73988887777', 'Olá');
    expect(href).toMatch(/^https:\/\/wa\.me\/5573988887777\?text=/);
  });

  it('inclui o link do documento na mensagem', () => {
    const message = buildLeadDocumentWhatsAppMessage(
      'Ana',
      'contrato.pdf',
      'http://localhost:3111/api/public/documents/abc',
    );
    expect(message).toContain('contrato.pdf');
    expect(message).toContain('/api/public/documents/abc');
  });
});
