import { X509Certificate } from 'crypto';
import {
  loadSefazCaBundle,
  resetSefazCaBundleCache,
  resolveSefazCaBundlePath,
} from '../sefaz-ca-bundle';
import { SefazCaBundleNotFoundError } from '../errors/sefaz-ca-bundle-not-found.error';

/// D1 — o bundle é material criptográfico versionado no repositório. Estes
/// testes existem para que um arquivo corrompido, truncado ou vencido apareça
/// no CI em vez de virar `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` em produção.
describe('sefaz-ca-bundle', () => {
  afterEach(() => {
    resetSefazCaBundleCache();
    delete process.env.SEFAZ_CA_BUNDLE_PATH;
  });

  function parseBundle(): X509Certificate[] {
    const pem = loadSefazCaBundle().toString('utf-8');
    const blocks: string[] =
      pem.match(
        /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g,
      ) ?? [];
    return blocks.map((block: string) => new X509Certificate(block));
  }

  it('loads the ICP-Brasil chain from the default path', () => {
    expect(resolveSefazCaBundlePath()).toContain('icp-brasil.pem');
    expect(parseBundle().length).toBeGreaterThanOrEqual(2);
  });

  it('contains the ICP-Brasil root and the SEFAZ issuing CA', () => {
    const subjects = parseBundle().map((cert) => cert.subject);

    expect(
      subjects.some((s) =>
        s.includes('Autoridade Certificadora Raiz Brasileira'),
      ),
    ).toBe(true);
    expect(subjects.some((s) => s.includes('Certisign'))).toBe(true);
  });

  /// Um certificado de CA vencido quebra a emissão sem nenhuma mudança de
  /// código — este teste transforma o vencimento em falha de CI antecipada.
  it('has no expired certificate in the chain', () => {
    const now = Date.now();
    for (const cert of parseBundle()) {
      expect(new Date(cert.validTo).getTime()).toBeGreaterThan(now);
    }
  });

  it('fails with a configuration error when the bundle is missing', () => {
    process.env.SEFAZ_CA_BUNDLE_PATH = '/caminho/que/nao/existe/ca.pem';

    expect(() => loadSefazCaBundle()).toThrow(SefazCaBundleNotFoundError);
  });
});
