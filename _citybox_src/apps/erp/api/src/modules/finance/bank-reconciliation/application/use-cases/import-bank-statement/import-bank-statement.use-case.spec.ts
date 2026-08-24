import { readFileSync } from 'fs';
import { join } from 'path';
import { InMemoryObjectStorage } from '../../../../../../shared/infra/storage/in-memory-object-storage';
import { BankAccountNotFoundError } from '../../../../bank-accounts/domain/errors/bank-account-not-found.error';
import { InvalidOfxFileError } from '../../../domain/errors/invalid-ofx-file.error';
import { BankAccountRequiredError } from '../../../domain/errors/bank-account-required.error';
import { NoBankAccountRegisteredError } from '../../../domain/errors/no-bank-account-registered.error';
import {
  ORGANIZATION_ID,
  OTHER_ORGANIZATION_ID,
  BANK_ACCOUNT_ID,
  makeBankAccount,
  makeBankAccountRepositories,
  makeBankReconciliationRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { ImportBankStatementUseCase } from './import-bank-statement.use-case';

const FIXTURES_DIR = join(__dirname, '..', '..', '..', 'tests', 'fixtures');

function loadFixture(fileName: string): Buffer {
  return readFileSync(join(FIXTURES_DIR, fileName));
}

function setup() {
  const { bankAccountRepository } = makeBankAccountRepositories();
  const { bankStatementRepository, bankStatementTransactionRepository } =
    makeBankReconciliationRepositories();
  const storage = new InMemoryObjectStorage();

  const useCase = new ImportBankStatementUseCase(
    bankStatementRepository,
    bankStatementTransactionRepository,
    bankAccountRepository,
    storage,
  );

  return {
    bankAccountRepository,
    bankStatementRepository,
    bankStatementTransactionRepository,
    storage,
    useCase,
  };
}

describe('ImportBankStatementUseCase', () => {
  it('importa um extrato OFX válido, persiste o arquivo e cria as transações como pendentes', async () => {
    const {
      bankAccountRepository,
      bankStatementTransactionRepository,
      storage,
      useCase,
    } = setup();
    await bankAccountRepository.save(makeBankAccount());

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      fileName: 'extrato-julho.ofx',
      buffer: loadFixture('sample-1.1x-latin1.ofx'),
    });

    expect(result.bankStatement.bankAccountId).toBe(BANK_ACCOUNT_ID);
    expect(result.bankStatement.accountNumber).toBe('567890');
    expect(result.bankStatement.pendingCount).toBe(2);
    expect(result.bankStatement.status).toBe('not_reconciled');
    expect(result.summary).toEqual({
      totalInFile: 2,
      imported: 2,
      skippedDuplicates: 0,
    });

    const transactions =
      await bankStatementTransactionRepository.findByStatement(
        ORGANIZATION_ID,
        result.bankStatement.id,
        { status: 'pending' },
      );
    expect(transactions).toHaveLength(2);
    expect(transactions.every((t) => t.status === 'pending')).toBe(true);

    const stored = await storage.get(result.bankStatement.objectKey);
    expect(stored.buffer.length).toBeGreaterThan(0);
  });

  it('recusa importar para uma conta bancária de outra organização', async () => {
    const { bankAccountRepository, useCase } = setup();
    await bankAccountRepository.save(
      makeBankAccount({ organizationId: OTHER_ORGANIZATION_ID }),
    );

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        fileName: 'extrato.ofx',
        buffer: loadFixture('sample-1.1x-latin1.ofx'),
      }),
    ).rejects.toBeInstanceOf(BankAccountNotFoundError);
  });

  it('recusa importar um arquivo com extensão diferente de .ofx', async () => {
    const { bankAccountRepository, useCase } = setup();
    await bankAccountRepository.save(makeBankAccount());

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        fileName: 'extrato.txt',
        buffer: loadFixture('sample-1.1x-latin1.ofx'),
      }),
    ).rejects.toBeInstanceOf(InvalidOfxFileError);
  });

  it('recusa um arquivo .ofx com conteúdo ilegível, sem gravar nada', async () => {
    const { bankAccountRepository, bankStatementRepository, useCase } = setup();
    await bankAccountRepository.save(makeBankAccount());

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        bankAccountId: BANK_ACCOUNT_ID,
        fileName: 'corrupted.ofx',
        buffer: loadFixture('corrupted.ofx'),
      }),
    ).rejects.toBeInstanceOf(InvalidOfxFileError);

    const statements = await bankStatementRepository.findAll(ORGANIZATION_ID);
    expect(statements).toHaveLength(0);
  });

  it('reimportar o mesmo arquivo não duplica transações e informa o resumo', async () => {
    const { bankAccountRepository, useCase } = setup();
    await bankAccountRepository.save(makeBankAccount());
    const buffer = loadFixture('sample-1.1x-latin1.ofx');

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      fileName: 'extrato-julho.ofx',
      buffer,
    });

    const second = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      fileName: 'extrato-julho.ofx',
      buffer,
    });

    expect(second.summary).toEqual({
      totalInFile: 2,
      imported: 0,
      skippedDuplicates: 2,
    });
  });

  // FR-001 / research.md D26 (2026-08-14) — a conta bancária voltou a ser
  // obrigatória na importação. Estes 3 casos substituem os testes da
  // `007-financeiro-ajustes-ui` US4 (FR-007/FR-007a/FR-007b), que cobriam
  // importar SEM conta e deixar o `bankCode` do arquivo resolver sozinho.
  // Motivo da reversão: `BankAccount` guarda só `bankCode`, o OFX traz agência
  // e conta, e não existe chave confiável entre os dois — na prática o extrato
  // ficava sem conta e a conciliação inteira travava.
  it('recusa a importação quando nenhuma conta bancária é informada', async () => {
    const { bankAccountRepository, bankStatementRepository, useCase } = setup();
    await bankAccountRepository.save(makeBankAccount({ bankCode: '001' }));

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        fileName: 'extrato-julho.ofx',
        buffer: loadFixture('sample-1.1x-latin1.ofx'),
      }),
    ).rejects.toBeInstanceOf(BankAccountRequiredError);

    // Nada gravado: nem o extrato, nem o arquivo no storage.
    const statements = await bankStatementRepository.findAll(ORGANIZATION_ID);
    expect(statements).toHaveLength(0);
  });

  it('recusa com erro próprio quando a organização não tem nenhuma conta bancária cadastrada', async () => {
    // Sem conta informada E sem nenhuma cadastrada: a interface não tinha o que
    // oferecer para escolher. Erro distinto do anterior para a tela poder
    // orientar "cadastre uma conta" em vez de "selecione uma conta".
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        fileName: 'extrato-julho.ofx',
        buffer: loadFixture('sample-1.1x-latin1.ofx'),
      }),
    ).rejects.toBeInstanceOf(NoBankAccountRegisteredError);
  });

  // Decisão de 2026-08-14 — dedupe ignora transações excluídas.
  it('reimporta as transações de um extrato cujas transações foram todas excluídas', async () => {
    const {
      bankAccountRepository,
      bankStatementRepository,
      bankStatementTransactionRepository,
      useCase,
    } = setup();
    await bankAccountRepository.save(makeBankAccount());

    const first = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      fileName: 'extrato-julho.ofx',
      buffer: loadFixture('sample-1.1x-latin1.ofx'),
    });
    expect(first.summary.imported).toBe(2);

    // Operador exclui todas as transações do extrato.
    const imported = await bankStatementTransactionRepository.findByStatement(
      ORGANIZATION_ID,
      first.bankStatement.id,
      { status: 'pending' },
    );
    for (const transaction of imported) {
      await bankStatementTransactionRepository.save(transaction.discard());
    }

    // Reimportar o MESMO arquivo precisa devolver um extrato utilizável — antes
    // desta mudança vinha vazio, e sem como apagar o extrato o operador ficava
    // preso num loop de importações vazias.
    const second = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      fileName: 'extrato-julho.ofx',
      buffer: loadFixture('sample-1.1x-latin1.ofx'),
    });

    expect(second.summary.imported).toBe(2);
    expect(second.summary.skippedDuplicates).toBe(0);
    expect(second.bankStatement.pendingCount).toBe(2);

    // O extrato antigo perdeu as linhas excluídas (o banco tem
    // `@@unique([organizationId, dedupeKey])`, então elas precisam sair para as
    // novas entrarem) — seus contadores não podem continuar apontando 2.
    const previous = await bankStatementRepository.findById(
      ORGANIZATION_ID,
      first.bankStatement.id,
    );
    expect(previous?.discardedCount).toBe(0);
  });

  it('importa normalmente quando o código do banco do arquivo não bate com a conta informada', async () => {
    // Caso real relatado em produção: arquivo declara "Banco 1", a organização
    // só tem Banco do Brasil. O código do banco nunca decide a importação —
    // vale a conta que o operador escolheu.
    const { bankAccountRepository, useCase } = setup();
    await bankAccountRepository.save(makeBankAccount({ bankCode: '999' }));

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      bankAccountId: BANK_ACCOUNT_ID,
      fileName: 'extrato-julho.ofx',
      buffer: loadFixture('sample-1.1x-latin1.ofx'),
    });

    expect(result.bankStatement.bankAccountId).toBe(BANK_ACCOUNT_ID);
    expect(result.summary.imported).toBe(2);
  });
});
