import { InMemoryObjectStorage } from '../../../../../../shared/infra/storage/in-memory-object-storage';
import { BankStatementNotFoundError } from '../../../domain/errors/bank-statement-not-found.error';
import { BankStatementHasReconciliationError } from '../../../domain/errors/bank-statement-has-reconciliation.error';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  makeBankStatement,
  makeBankStatementTransaction,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { DeleteBankStatementUseCase } from './delete-bank-statement.use-case';

function setup() {
  const { bankStatementRepository, bankStatementTransactionRepository } =
    makeBankReconciliationRepositories();
  const storage = new InMemoryObjectStorage();

  const useCase = new DeleteBankStatementUseCase(
    bankStatementRepository,
    bankStatementTransactionRepository,
    storage,
  );

  return {
    bankStatementRepository,
    bankStatementTransactionRepository,
    storage,
    useCase,
  };
}

describe('DeleteBankStatementUseCase', () => {
  it('apaga o extrato, suas transações e o arquivo do storage', async () => {
    const {
      bankStatementRepository,
      bankStatementTransactionRepository,
      storage,
      useCase,
    } = setup();
    const statement = makeBankStatement();
    await bankStatementRepository.save(statement);
    await bankStatementTransactionRepository.saveMany([
      makeBankStatementTransaction({ bankStatementId: statement.id }),
    ]);
    await storage.put({
      key: statement.objectKey,
      buffer: Buffer.from('OFX'),
      mimeType: 'application/x-ofx',
    });

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: statement.id,
    });

    expect(
      await bankStatementRepository.findById(ORGANIZATION_ID, statement.id),
    ).toBeNull();
    expect(
      await bankStatementTransactionRepository.countByStatement(
        ORGANIZATION_ID,
        statement.id,
      ),
    ).toEqual({ pendingCount: 0, reconciledCount: 0, discardedCount: 0 });
    expect(await storage.exists(statement.objectKey)).toBe(false);
  });

  it('recusa quando o extrato ainda tem transação conciliada', async () => {
    const { bankStatementRepository, useCase } = setup();
    const statement = makeBankStatement({ reconciledCount: 1 });
    await bankStatementRepository.save(statement);

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankStatementId: statement.id,
      }),
    ).rejects.toBeInstanceOf(BankStatementHasReconciliationError);

    expect(
      await bankStatementRepository.findById(ORGANIZATION_ID, statement.id),
    ).not.toBeNull();
  });

  it('permite excluir um extrato cujas transações estão todas excluídas', async () => {
    // É o caso que motivou a funcionalidade: o operador excluiu as transações
    // (única ação disponível), o extrato ficou inútil e sem saída.
    const { bankStatementRepository, useCase } = setup();
    const statement = makeBankStatement({ discardedCount: 5 });
    await bankStatementRepository.save(statement);

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankStatementId: statement.id,
    });

    expect(
      await bankStatementRepository.findById(ORGANIZATION_ID, statement.id),
    ).toBeNull();
  });

  it('não encontra extrato de outra organização', async () => {
    const { bankStatementRepository, useCase } = setup();
    const statement = makeBankStatement();
    await bankStatementRepository.save(statement);

    await expect(
      useCase.execute({
        organizationId: OTHER_ORGANIZATION_ID,
        bankStatementId: statement.id,
      }),
    ).rejects.toBeInstanceOf(BankStatementNotFoundError);
  });
});
