import { NfseNationalRejectionError } from '../errors/nfse-national-rejection.error';
import { NATIONAL_ERROR_HINTS } from '../national-error-codes';

describe('NfseNationalRejectionError', () => {
  it('exposes the official code to the client, not the class name', () => {
    const error = new NfseNationalRejectionError('IssueNfseUseCase', 'E1208');

    // O filtro HTTP publica `externalCode` em `error.code` — quem consome
    // precisa do código do governo para procurar na documentação oficial.
    expect(error.externalCode).toBe('E1208');
    expect(error.nationalCode).toBe('E1208');
  });

  it('joins the authoritative message with the actionable hint', () => {
    const error = new NfseNationalRejectionError('IssueNfseUseCase', 'E1208');

    expect(error.externalMessage).toContain('ICP');
    expect(error.externalMessage).toContain(NATIONAL_ERROR_HINTS.CERTIFICATE);
  });

  it('still produces a usable message for a code outside the catalogue', () => {
    const error = new NfseNationalRejectionError('IssueNfseUseCase', 'E7777');

    expect(error.externalCode).toBe('E7777');
    expect(error.externalMessage).toContain('E7777');
    // Não inventa significado para código desconhecido.
    expect(error.internalMessage).toContain('não catalogado');
  });
});
