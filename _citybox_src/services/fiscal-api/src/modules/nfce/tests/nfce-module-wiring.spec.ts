import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { IssueNfceRoute } from '../infrastructure/http/routes/issue-nfce/issue-nfce.route';
import { GetNfceRoute } from '../infrastructure/http/routes/get-nfce/get-nfce.route';
import { GetNfceXmlRoute } from '../infrastructure/http/routes/get-nfce-xml/get-nfce-xml.route';
import { GetDanfceRoute } from '../infrastructure/http/routes/get-danfce/get-danfce.route';
import { CancelNfceRoute } from '../infrastructure/http/routes/cancel-nfce/cancel-nfce.route';
import { InutilizeNfceRoute } from '../infrastructure/http/routes/inutilize-nfce/inutilize-nfce.route';

/// ⚠️ **O que esta suíte pega e nenhuma outra pega.**
///
/// `tsc` valida tipos, não o grafo de injeção do Nest. Uma rota que dependa de
/// um caso de uso **não exportado** pelo módulo de origem compila, passa em
/// todos os testes de unidade — e derruba a API no boot, com
/// `Nest can't resolve dependencies`.
///
/// Aconteceu de fato ao acrescentar as rotas de cancelamento e inutilização de
/// cupom: elas reusam `CancelNfeUseCase` e `InutilizeNfeUseCase`, que o
/// `NfeModule` mantinha privados. O typecheck não disse nada.
///
/// `.compile()` resolve o container inteiro, então a ausência vira falha aqui,
/// no lugar barato.
describe('NfceModule — grafo de injeção', () => {
  it('resolve todas as rotas de cupom fiscal', async () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      'base64',
    );
    process.env.DATABASE_URL ??=
      'postgresql://user:pass@127.0.0.1:5432/db?schema=fiscal';

    // ⚠️ `AppModule`, não `NfceModule` isolado. O módulo sozinho não recebe o
    // `ProvidersModule`, então testá-lo em isolamento exercitaria um grafo que
    // não existe em produção — e falharia por um motivo que não é defeito.
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Cada `get` falha se alguma dependência da rota não puder ser construída.
    for (const route of [
      IssueNfceRoute,
      GetNfceRoute,
      GetNfceXmlRoute,
      GetDanfceRoute,
      CancelNfceRoute,
      InutilizeNfceRoute,
    ]) {
      expect(moduleRef.get(route)).toBeDefined();
    }

    await moduleRef.close();
  }, 60_000);
});
