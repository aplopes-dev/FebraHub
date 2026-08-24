import { Module } from '@nestjs/common';

import { BankAccountRepository } from './domain/repositories/bank-account.repository.interface';
import { PrismaBankAccountRepository } from './infrastructure/database/prisma-bank-account.repository';
import { BankTransactionRepository } from './domain/repositories/bank-transaction.repository.interface';
import { PrismaBankTransactionRepository } from './infrastructure/database/prisma-bank-transaction.repository';

import { CreateBankAccountUseCase } from './application/use-cases/create-bank-account/create-bank-account.use-case';
import { ListBankAccountsUseCase } from './application/use-cases/list-bank-accounts/list-bank-accounts.use-case';
import { FindBankAccountByIdUseCase } from './application/use-cases/find-bank-account-by-id/find-bank-account-by-id.use-case';
import { UpdateBankAccountUseCase } from './application/use-cases/update-bank-account/update-bank-account.use-case';
import { DeleteBankAccountUseCase } from './application/use-cases/delete-bank-account/delete-bank-account.use-case';
import { RestoreBankAccountUseCase } from './application/use-cases/restore-bank-account/restore-bank-account.use-case';
import { GetBankAccountStatementUseCase } from './application/use-cases/get-bank-account-statement/get-bank-account-statement.use-case';
import { ListBankAccountTransactionsUseCase } from './application/use-cases/list-bank-account-transactions/list-bank-account-transactions.use-case';

import { ListBankAccountsRoute } from './infrastructure/http/routes/list-bank-accounts/list-bank-accounts.route';
import { CreateBankAccountRoute } from './infrastructure/http/routes/create-bank-account/create-bank-account.route';
import { RestoreBankAccountRoute } from './infrastructure/http/routes/restore-bank-account/restore-bank-account.route';
import { FindBankAccountByIdRoute } from './infrastructure/http/routes/find-bank-account-by-id/find-bank-account-by-id.route';
import { UpdateBankAccountRoute } from './infrastructure/http/routes/update-bank-account/update-bank-account.route';
import { DeleteBankAccountRoute } from './infrastructure/http/routes/delete-bank-account/delete-bank-account.route';
import { GetBankAccountStatementRoute } from './infrastructure/http/routes/get-bank-account-statement/get-bank-account-statement.route';
import { ListBankAccountTransactionsRoute } from './infrastructure/http/routes/list-bank-account-transactions/list-bank-account-transactions.route';

/**
 * Contas bancárias da organização + o livro-razão de movimentações
 * (`BankTransaction`) que dá o saldo real de cada uma — ver
 * `specs/erp/002-bank-account-ledger/`.
 *
 * Exporta `BankAccountRepository` (outros módulos de finanças conferem que a
 * conta informada existe — é o caso dos lançamentos) e `BankTransactionRepository`
 * (leitura do ledger, consumida por `bank-transfers` e por telas que precisam
 * do saldo/extrato de uma conta fora deste módulo).
 */
@Module({
  // Ordem importa: as rotas de caminho fixo antes de `:id`, para o Nest não
  // tratar um segmento fixo como parâmetro.
  controllers: [
    ListBankAccountsRoute,
    CreateBankAccountRoute,
    RestoreBankAccountRoute,
    GetBankAccountStatementRoute,
    ListBankAccountTransactionsRoute,
    FindBankAccountByIdRoute,
    UpdateBankAccountRoute,
    DeleteBankAccountRoute,
  ],
  providers: [
    { provide: BankAccountRepository, useClass: PrismaBankAccountRepository },
    {
      provide: BankTransactionRepository,
      useClass: PrismaBankTransactionRepository,
    },
    CreateBankAccountUseCase,
    ListBankAccountsUseCase,
    FindBankAccountByIdUseCase,
    UpdateBankAccountUseCase,
    DeleteBankAccountUseCase,
    RestoreBankAccountUseCase,
    GetBankAccountStatementUseCase,
    ListBankAccountTransactionsUseCase,
  ],
  exports: [BankAccountRepository, BankTransactionRepository],
})
export class BankAccountsModule {}
