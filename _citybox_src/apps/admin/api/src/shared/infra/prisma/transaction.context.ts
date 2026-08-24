import { AsyncLocalStorage } from 'node:async_hooks';
import type { PrismaClient } from '../../../../generated/prisma/client';

/**
 * Cliente transacional do Prisma — o que `$transaction(async (tx) => ...)` entrega.
 * Não tem `$transaction`/`$connect`/`$disconnect`, por isso o Omit.
 */
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$transaction' | '$connect' | '$disconnect' | '$on' | '$use' | '$extends'
>;

/**
 * Propaga o cliente transacional para os repositórios sem precisar passar `tx`
 * como parâmetro em cada método (`save(store, tx)`).
 *
 * `PrismaService.db` lê deste storage: dentro de `UnitOfWork.run()` devolve o `tx`,
 * fora devolve o client normal. É o que permite ao outbox ser gravado na mesma
 * transação da escrita de domínio sem reescrever a interface de todo repositório.
 */
export const transactionStorage =
  new AsyncLocalStorage<PrismaTransactionClient>();

export function currentTransaction(): PrismaTransactionClient | undefined {
  return transactionStorage.getStore();
}

/**
 * Client a usar nos repositórios: o transacional quando dentro de `UnitOfWork.run()`,
 * senão o normal.
 *
 * É função e **não** um getter em `PrismaService` de propósito. O client do Prisma 7 é um
 * Proxy que resolve qualquer propriedade desconhecida como delegate de model: um getter
 * `db` na subclasse nunca era chamado — `prisma.db` devolvia um delegate fantasma para um
 * "model db", e `prisma.db.store` vinha `undefined`. Só quebrava em runtime, porque os
 * testes usam repositórios in-memory.
 */
export function txClient<T>(prisma: T): T {
  return (currentTransaction() as T | undefined) ?? prisma;
}
