import { SignedXml } from 'xml-crypto';
import { signXml } from '../xml-signer';
import { XmlSignatureError } from '../errors/xml-signature.error';
import { buildSelfSignedCertificateFixture } from './fixtures/self-signed-certificate';

const SAMPLE_XML =
  '<root><infNFe Id="NFe123"><item>valor</item></infNFe></root>';

/// xml-crypto exige a assinatura extraída separadamente para verificar
/// (`loadSignature`) — não faz a busca sozinho a partir do XML completo. Ver
/// README "Verifying Xml documents". `loadSignature` aceita uma string e faz
/// o parse internamente (usa o xmldom já embutido na própria dependência),
/// então não precisamos de um parser DOM próprio só para este teste.
function extractSignatureElement(signedXml: string): string {
  const match = signedXml.match(/<Signature[\s\S]*<\/Signature>/);
  if (!match) throw new Error('Signature element not found in test fixture');
  return match[0];
}

describe('signXml', () => {
  it('produces an enveloped XMLDSig signature that verifies against the embedded certificate', () => {
    const fixture = buildSelfSignedCertificateFixture();

    const signedXml = signXml({
      xml: SAMPLE_XML,
      privateKeyPem: fixture.privateKeyPem,
      certificatePem: fixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='root']",
    });

    expect(signedXml).toContain('<Signature');
    expect(signedXml).toContain('SignatureValue');
    expect(signedXml).toContain('DigestValue');
    expect(signedXml).toContain('X509Certificate');

    // xml-crypto só ativa a extração automática do certificado a partir do
    // KeyInfo quando você opta explicitamente — por padrão o construtor zera
    // `getCertFromKeyInfo` para no-op (mesmo comportamento do exemplo oficial
    // do README, que também passa `publicCert` explicitamente ao verificar).
    const verifier = new SignedXml({ publicCert: fixture.certificatePem });
    verifier.loadSignature(extractSignatureElement(signedXml));
    expect(verifier.checkSignature(signedXml)).toBe(true);
  });

  it('produces a signature that fails verification if the XML is tampered with afterwards', () => {
    const fixture = buildSelfSignedCertificateFixture();

    const signedXml = signXml({
      xml: SAMPLE_XML,
      privateKeyPem: fixture.privateKeyPem,
      certificatePem: fixture.certificatePem,
      referenceXPath: "//*[local-name(.)='infNFe']",
      signatureLocationXPath: "//*[local-name(.)='root']",
    });

    const tampered = signedXml.replace('valor', 'valor-adulterado');

    const verifier = new SignedXml({ publicCert: fixture.certificatePem });
    verifier.loadSignature(extractSignatureElement(tampered));
    expect(verifier.checkSignature(tampered)).toBe(false);
  });

  it('wraps signing failures in XmlSignatureError (invalid key material)', () => {
    expect(() =>
      signXml({
        xml: SAMPLE_XML,
        privateKeyPem: 'not-a-valid-pem-key',
        certificatePem: 'not-a-valid-pem-cert',
        referenceXPath: "//*[local-name(.)='infNFe']",
        signatureLocationXPath: "//*[local-name(.)='root']",
      }),
    ).toThrow(XmlSignatureError);
  });
});
