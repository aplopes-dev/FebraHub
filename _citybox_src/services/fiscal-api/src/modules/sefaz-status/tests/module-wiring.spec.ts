import { Test } from '@nestjs/testing';
import { AppModule } from '../../../app.module';
import { CheckStatusRoute } from '../infrastructure/http/routes/check-status/check-status.route';
import { CheckSefazStatusUseCase } from '../application/use-cases/check-sefaz-status/check-sefaz-status.use-case';

/// ⚠️ **O que esta suíte pega e nenhuma outra pega.**
///
/// `tsc` valida tipos, não o grafo de injeção do Nest. Uma rota que dependa de
/// um provider não registrado (ou de um módulo não importado) compila, passa em
/// todos os testes de unidade — e derruba a API no boot com
/// `Nest can't resolve dependencies`. `.compile()` resolve o container inteiro,
/// então a ausência vira falha aqui, no lugar barato.
///
/// Usa `AppModule` (não `SefazStatusModule` isolado): o probe depende de
/// `CertificateRepository`/`CompanyRepository`/`ObjectStorage`/`CompanyAccessPolicy`,
/// exportados por outros módulos — testar em isolamento exercitaria um grafo
/// que não existe em produção (lição da spec 005).
describe('SefazStatusModule — grafo de injeção', () => {
  it('resolve a rota de status e seu caso de uso', async () => {
    process.env.FISCAL_CERT_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      'base64',
    );
    process.env.DATABASE_URL ??=
      'postgresql://user:pass@127.0.0.1:5432/db?schema=fiscal';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(moduleRef.get(CheckStatusRoute)).toBeDefined();
    expect(moduleRef.get(CheckSefazStatusUseCase)).toBeDefined();

    await moduleRef.close();
  });
});
