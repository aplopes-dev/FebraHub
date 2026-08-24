import { publicLeadDocumentSharePath } from './document-share.policy';

describe('document-share.policy', () => {
  it('aponta o link do WhatsApp para a página /d/:token', () => {
    expect(publicLeadDocumentSharePath('abc')).toBe('/d/abc');
  });
});
