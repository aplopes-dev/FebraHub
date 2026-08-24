import { readFileSync } from 'fs';
import { join } from 'path';
import { InvalidOfxFileError } from '../../../domain/errors/invalid-ofx-file.error';
import {
  ORGANIZATION_ID,
  BANK_ACCOUNT_ID,
  makeBankAccount,
  makeBankAccountRepositories,
} from '../../../tests/bank-reconciliation-test-factory';
import { PreviewBankStatementUseCase } from './preview-bank-statement.use-case';

const FIXTURES_DIR = join(__dirname, '..', '..', '..', 'tests', 'fixtures');

function loadFixture(fileName: string): Buffer {
  return readFileSync(join(FIXTURES_DIR, fileName));
}

function setup() {
  const { bankAccountRepository } = makeBankAccountRepositories();
  const useCase = new PreviewBankStatementUseCase(bankAccountRepository);
  return { bankAccountRepository, useCase };
}

describe('PreviewBankStatementUseCase', () => {
  it('devolve o código do banco e sugere a conta quando há exatamente 1 correspondência', async () => {
    const { bankAccountRepository, useCase } = setup();
    await bankAccountRepository.save(makeBankAccount({ bankCode: '001' }));

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      fileName: 'extrato.ofx',
      buffer: loadFixture('sample-1.1x-latin1.ofx'),
    });

    expect(result.bankCode).toBe('001');
    expect(result.suggestedBankAccountId).toBe(BANK_ACCOUNT_ID);
  });

  it('não sugere conta quando nenhuma bate com o código do banco', async () => {
    const { useCase } = setup();

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      fileName: 'extrato.ofx',
      buffer: loadFixture('sample-1.1x-latin1.ofx'),
    });

    expect(result.suggestedBankAccountId).toBeNull();
  });

  it('recusa arquivo com extensão diferente de .ofx, sem parsear nada', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        fileName: 'extrato.txt',
        buffer: loadFixture('sample-1.1x-latin1.ofx'),
      }),
    ).rejects.toBeInstanceOf(InvalidOfxFileError);
  });

  it('recusa um arquivo .ofx ilegível', async () => {
    const { useCase } = setup();

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        fileName: 'corrupted.ofx',
        buffer: loadFixture('corrupted.ofx'),
      }),
    ).rejects.toBeInstanceOf(InvalidOfxFileError);
  });
});
