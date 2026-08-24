import { Test } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { CreateTransactionUseCase } from '../transactions/application/use-cases/create-transaction/create-transaction.use-case';
import { GetFinancialSummaryUseCase } from './application/use-cases/get-financial-summary/get-financial-summary.use-case';

/**
 * `FinanceModule` e `TransactionsModule` se referenciam via `forwardRef`. Este teste
 * garante que o grafo de DI continua resolvendo os dois lados.
 */
describe('finance/transactions DI wiring', () => {
  it('resolves both sides of the circular module reference', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    expect(
      moduleRef.get(CreateTransactionUseCase, { strict: false }),
    ).toBeDefined();
    expect(
      moduleRef.get(GetFinancialSummaryUseCase, { strict: false }),
    ).toBeDefined();
  });
});
