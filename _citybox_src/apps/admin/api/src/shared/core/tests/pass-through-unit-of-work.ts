import { UnitOfWork } from '../unit-of-work';

/**
 * `UnitOfWork` para specs com repositórios in-memory: apenas executa o trabalho.
 *
 * Não simula rollback — os repositórios in-memory não têm transação. Specs que precisem
 * provar atomicidade de verdade devem usar Postgres real, não este dublê.
 */
export function createPassThroughUnitOfWork(): UnitOfWork {
  return { run: <T>(work: () => Promise<T>) => work() };
}
