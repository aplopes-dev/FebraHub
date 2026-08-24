import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../../shared/core/use-case.interface';
import { ObjectStorage } from '../../../../../../shared/domain/storage/object-storage.interface';
import { BankAccountRepository } from '../../../../bank-accounts/domain/repositories/bank-account.repository.interface';
import { BankStatement } from '../../../domain/entities/bank-statement.entity';
import {
  BankStatementTransaction,
  type BankStatementTransactionKind,
} from '../../../domain/entities/bank-statement-transaction.entity';
import { BankStatementRepository } from '../../../domain/repositories/bank-statement.repository.interface';
import { BankStatementTransactionRepository } from '../../../domain/repositories/bank-statement-transaction.repository.interface';
import {
  parseOfxFile,
  OfxParseError,
} from '../../../domain/services/ofx-parser';
import { computeDedupeKey } from '../../../domain/services/dedupe-key';
import { InvalidOfxFileError } from '../../../domain/errors/invalid-ofx-file.error';
import { BankAccountRequiredError } from '../../../domain/errors/bank-account-required.error';
import { NoBankAccountRegisteredError } from '../../../domain/errors/no-bank-account-registered.error';
import { BankReconciliationObjectKeyPolicy } from '../../policies/bank-reconciliation-object-key.policy';
import { assertBankAccountExists } from '../assert-bank-account-exists';
import type {
  ImportBankStatementDto,
  ImportBankStatementResult,
} from '../../dtos/bank-statement.dto';

const OFX_MIME_TYPE = 'application/x-ofx';

@Injectable()
export class ImportBankStatementUseCase implements IUseCase<
  ImportBankStatementDto,
  ImportBankStatementResult
> {
  constructor(
    private readonly bankStatementRepository: BankStatementRepository,
    private readonly bankStatementTransactionRepository: BankStatementTransactionRepository,
    private readonly bankAccountRepository: BankAccountRepository,
    private readonly storage: ObjectStorage,
  ) {}

  async execute(
    dto: ImportBankStatementDto,
  ): Promise<ImportBankStatementResult> {
    if (!/\.ofx$/i.test(dto.fileName)) {
      throw new InvalidOfxFileError(
        `unsupported file extension: "${dto.fileName}"`,
      );
    }

    // FR-001 (research.md D26) — a conta bancária é obrigatória. Checado
    // ANTES de parsear e de gravar qualquer coisa: uma importação recusada não
    // pode deixar arquivo no storage nem extrato no banco.
    //
    // Substitui a resolução automática pelo `bankCode` da
    // `007-financeiro-ajustes-ui` (FR-007a/FR-007b): o cadastro guarda só o
    // código do banco, o arquivo traz agência e conta, e não há chave confiável
    // entre os dois — o extrato acabava sem conta e travava a conciliação
    // inteira. O `bankCode` continua servindo à rota `preview`, que apenas
    // pré-seleciona o campo na interface.
    if (!dto.bankAccountId) {
      const registeredAccounts = await this.bankAccountRepository.count(
        dto.organizationId,
        { tab: 'active' },
      );
      throw registeredAccounts === 0
        ? new NoBankAccountRegisteredError()
        : new BankAccountRequiredError();
    }

    const bankAccountId = await assertBankAccountExists(
      this.bankAccountRepository,
      dto.organizationId,
      dto.bankAccountId,
    );

    const parsed = this.parseFile(dto.buffer);

    // Dedupe intra-arquivo (o mesmo FITID pode se repetir dentro do próprio
    // arquivo em bancos com exportação instável) — mantém a primeira ocorrência.
    const seenInFile = new Map<
      string,
      { transaction: (typeof parsed.transactions)[number]; dedupeKey: string }
    >();
    for (const transaction of parsed.transactions) {
      const dedupeKey = computeDedupeKey({
        bankCode: parsed.bankCode,
        accountNumber: parsed.accountNumber,
        fitId: transaction.fitId,
        postedAt: transaction.postedAt,
        amountCents: transaction.amountCents,
        memo: transaction.memo,
      });
      if (!seenInFile.has(dedupeKey)) {
        seenInFile.set(dedupeKey, { transaction, dedupeKey });
      }
    }

    const candidateKeys = [...seenInFile.keys()];
    const existingKeys =
      await this.bankStatementTransactionRepository.findExistingDedupeKeys(
        dto.organizationId,
        candidateKeys,
      );

    const newEntries = candidateKeys.filter((key) => !existingKeys.has(key));

    // FR-046 — `findExistingDedupeKeys` ignora transações excluídas, mas o banco
    // tem `@@unique([organizationId, dedupeKey])`: sem apagar as linhas
    // excluídas que carregam essas chaves, o insert abaixo viola a constraint
    // (P2002). Reimportar supersede o que foi descartado.
    const statementsLosingTransactions =
      await this.bankStatementTransactionRepository.deleteDiscardedByDedupeKeys(
        dto.organizationId,
        newEntries,
      );
    // Os extratos que perderam essas linhas ficam com `discardedCount` contando
    // transações que não existem mais — recalcula antes de seguir.
    for (const affectedId of statementsLosingTransactions) {
      const affected = await this.bankStatementRepository.findById(
        dto.organizationId,
        affectedId,
      );
      if (!affected) continue;
      const counts =
        await this.bankStatementTransactionRepository.countByStatement(
          dto.organizationId,
          affectedId,
        );
      await this.bankStatementRepository.save(
        affected.withRecalculatedCounts(counts),
      );
    }

    const bankStatementId = randomUUID();
    const objectKey = BankReconciliationObjectKeyPolicy.bankStatementFileKey(
      dto.organizationId,
      bankStatementId,
    );
    await this.storage.put({
      key: objectKey,
      buffer: dto.buffer,
      mimeType: OFX_MIME_TYPE,
    });

    const bankStatement = BankStatement.create(
      {
        organizationId: dto.organizationId,
        bankAccountId,
        bankName: '',
        bankCode: parsed.bankCode,
        branchNumber: parsed.branchNumber,
        accountNumber: parsed.accountNumber,
        periodStart: parsed.periodStart,
        periodEnd: parsed.periodEnd,
        pendingCount: newEntries.length,
        fileName: dto.fileName,
        objectKey,
        importedByName: dto.importedByName ?? '',
      },
      bankStatementId,
    );
    await this.bankStatementRepository.save(bankStatement);

    const newTransactions = newEntries.map((dedupeKey) => {
      const { transaction } = seenInFile.get(dedupeKey)!;
      const kind: BankStatementTransactionKind =
        transaction.amountCents < 0 ? 'debit' : 'credit';
      return BankStatementTransaction.create({
        organizationId: dto.organizationId,
        bankStatementId,
        bankAccountId,
        fitId: transaction.fitId,
        dedupeKey,
        postedAt: transaction.postedAt,
        amountCents: Math.abs(transaction.amountCents),
        kind,
        transactionType: transaction.transactionType,
        memo: transaction.memo,
      });
    });
    await this.bankStatementTransactionRepository.saveMany(newTransactions);

    return {
      bankStatement,
      summary: {
        totalInFile: parsed.transactions.length,
        imported: newTransactions.length,
        skippedDuplicates: parsed.transactions.length - newTransactions.length,
      },
    };
  }

  private parseFile(buffer: Buffer): ReturnType<typeof parseOfxFile> {
    try {
      return parseOfxFile(buffer);
    } catch (error) {
      if (error instanceof OfxParseError) {
        throw new InvalidOfxFileError(error.message);
      }
      throw error;
    }
  }
}
