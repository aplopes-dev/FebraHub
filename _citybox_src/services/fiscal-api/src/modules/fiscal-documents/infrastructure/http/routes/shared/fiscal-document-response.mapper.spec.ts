import { buildFiscalDocument } from '../../../../tests/fixtures/fiscal-document.fixture';
import { toFiscalDocumentResponse } from './fiscal-document-response.mapper';

/// Regressão do achado I1 (/speckit-analyze): `xmlUrl` apontava para
/// `/api/v1/fiscal-documents/{id}/xml`, rota que nunca existiu
/// (`FiscalDocumentsModule` só registra `GET`/`GET :id`/`GET :id/events`) —
/// um cliente seguindo o link da própria resposta da API recebia 404.
describe('toFiscalDocumentResponse', () => {
  it('points xmlUrl at the NF-e-specific download route when the XML is stored', () => {
    const document = buildFiscalDocument({
      documentType: 'NFE',
      xmlObjectKey: 'some-company/nfe/xml/doc-1.xml',
    });

    const response = toFiscalDocumentResponse(document);

    expect(response.xmlUrl).toBe(`/api/v1/nfe/${document.id}/xml`);
  });

  it('returns null xmlUrl when no XML has been stored yet', () => {
    const document = buildFiscalDocument({ xmlObjectKey: null });

    const response = toFiscalDocumentResponse(document);

    expect(response.xmlUrl).toBeNull();
  });

  it('points xmlUrl at the NFS-e-specific download route for NFSE documents', () => {
    const document = buildFiscalDocument({
      documentType: 'NFSE',
      provider: 'SEFIN_NACIONAL',
      xmlObjectKey: 'some-company/nfse/xml/doc-1.xml',
    });

    const response = toFiscalDocumentResponse(document);

    expect(response.xmlUrl).toBe(`/api/v1/nfse/${document.id}/xml`);
  });

  /// Coluna "Cliente" da tela Facilita NFE (spec `009-facilita-nfe-screen`,
  /// FR-004) — `customerName` é um join de leitura (`withCustomerName`), não
  /// uma prop de `FiscalDocumentProps`.
  it('exposes customerName when the entity carries it (join de leitura)', () => {
    const document = buildFiscalDocument().withCustomerName(
      'Empresa Cliente LTDA',
    );

    const response = toFiscalDocumentResponse(document);

    expect(response.customerName).toBe('Empresa Cliente LTDA');
  });

  it('exposes null customerName when the document has no customer', () => {
    const document = buildFiscalDocument({ customerId: null });

    const response = toFiscalDocumentResponse(document);

    expect(response.customerName).toBeNull();
  });
});
