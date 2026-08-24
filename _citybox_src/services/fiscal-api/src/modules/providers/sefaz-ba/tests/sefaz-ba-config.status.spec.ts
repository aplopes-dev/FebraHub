import { resolveSefazBaEndpoint } from '../infrastructure/sefaz-ba-config';
import { SefazEnvironmentNotConfiguredError } from '../errors/sefaz-environment-not-configured.error';

/// T014 — resolução do endpoint de `NFeStatusServico4` por modelo (spec
/// fiscal/001 R1). A mesma operação, órgão diferente por modelo.
describe('resolveSefazBaEndpoint — NFeStatusServico4', () => {
  it('NF-e (modelo 55) → SEFAZ-BA, path padrão', () => {
    const url = resolveSefazBaEndpoint(
      'NFeStatusServico4',
      'HOMOLOGATION',
      '55',
    );
    expect(url).toBe(
      'https://hnfe.sefaz.ba.gov.br/webservices/NFeStatusServico4/NFeStatusServico4.asmx',
    );
  });

  it('NFC-e (modelo 65) → SVRS, com a caixa própria do status', () => {
    const url = resolveSefazBaEndpoint(
      'NFeStatusServico4',
      'HOMOLOGATION',
      '65',
    );
    // Host do SVRS e path com caixa da lista oficial: pasta NfeStatusServico,
    // arquivo NFeStatusServico4.asmx.
    expect(url).toBe(
      'https://nfce-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NFeStatusServico4.asmx',
    );
  });

  it('PRODUCTION sem env configurada → recusa (FR-009)', () => {
    const previous = process.env.SEFAZ_BA_NFE_PRODUCTION_ENDPOINT;
    delete process.env.SEFAZ_BA_NFE_PRODUCTION_ENDPOINT;
    try {
      expect(() =>
        resolveSefazBaEndpoint('NFeStatusServico4', 'PRODUCTION', '55'),
      ).toThrow(SefazEnvironmentNotConfiguredError);
    } finally {
      if (previous !== undefined)
        process.env.SEFAZ_BA_NFE_PRODUCTION_ENDPOINT = previous;
    }
  });

  it('NFC-e PRODUCTION sem env → recusa (FR-009)', () => {
    const previous = process.env.SVRS_NFCE_PRODUCTION_ENDPOINT;
    delete process.env.SVRS_NFCE_PRODUCTION_ENDPOINT;
    try {
      expect(() =>
        resolveSefazBaEndpoint('NFeStatusServico4', 'PRODUCTION', '65'),
      ).toThrow(SefazEnvironmentNotConfiguredError);
    } finally {
      if (previous !== undefined)
        process.env.SVRS_NFCE_PRODUCTION_ENDPOINT = previous;
    }
  });
});
