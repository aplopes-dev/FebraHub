import { connect } from 'tls';
import { loadSefazCaBundle } from '../../src/shared/infra/fiscal-soap/sefaz-ca-bundle';

/// D1 — prova que o bundle ICP-Brasil versionado em `resources/ca/` de fato
/// valida a cadeia apresentada pelo servidor da SEFAZ-BA. Não usa certificado
/// de cliente: o objetivo é isolar a confiança no SERVIDOR, que é o que
/// falhava com `UNABLE_TO_GET_ISSUER_CERT_LOCALLY` antes desta correção.
///
/// Gated por `SEFAZ_TLS_INTEGRATION=1` porque depende de rede externa — não
/// deve derrubar o CI de quem roda offline.
const describeIfEnabled =
  process.env.SEFAZ_TLS_INTEGRATION === '1' ? describe : describe.skip;

const SEFAZ_HOST = 'hnfe.sefaz.ba.gov.br';

describeIfEnabled('TLS handshake com a SEFAZ-BA (rede externa)', () => {
  jest.setTimeout(30_000);

  function handshake(options: { withBundle: boolean }): Promise<{
    authorized: boolean;
    errorCode?: string;
  }> {
    return new Promise((resolve) => {
      const socket = connect(
        {
          host: SEFAZ_HOST,
          port: 443,
          servername: SEFAZ_HOST,
          rejectUnauthorized: true,
          ...(options.withBundle ? { ca: loadSefazCaBundle() } : {}),
        },
        () => {
          const authorized = socket.authorized;
          socket.end();
          resolve({ authorized });
        },
      );
      socket.on('error', (error: NodeJS.ErrnoException) => {
        socket.destroy();
        resolve({ authorized: false, errorCode: error.code });
      });
      socket.setTimeout(20_000, () => {
        socket.destroy();
        resolve({ authorized: false, errorCode: 'TIMEOUT' });
      });
    });
  }

  it('validates the SEFAZ server chain when the ICP-Brasil bundle is supplied', async () => {
    await expect(handshake({ withBundle: true })).resolves.toEqual({
      authorized: true,
    });
  });

  /// Guarda de regressão ao contrário: se algum dia o Node passar a confiar na
  /// ICP-Brasil por padrão, este teste falha e avisa que o bundle virou
  /// redundante — em vez de ele seguir versionado sem ninguém saber por quê.
  it('fails without the bundle, proving it is what makes the chain verifiable', async () => {
    const result = await handshake({ withBundle: false });

    expect(result.authorized).toBe(false);
    expect(result.errorCode).toBe('UNABLE_TO_GET_ISSUER_CERT_LOCALLY');
  });
});
