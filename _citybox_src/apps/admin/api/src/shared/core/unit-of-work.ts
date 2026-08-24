/**
 * Port de transação para a camada de aplicação.
 *
 * Existe para que um use case possa exigir atomicidade entre a escrita de domínio e o
 * enfileiramento do evento no outbox sem conhecer Prisma — a implementação vive em
 * `shared/infra/prisma/prisma-unit-of-work.ts`.
 *
 * Regras de uso:
 * - **Nunca** colocar I/O externo (Keycloak, gateway de pagamento, HTTP) dentro de `run()`:
 *   transação interativa do Prisma tem timeout (5s por padrão) e manter conexão aberta
 *   esperando rede é o caminho mais rápido para esgotar o pool.
 * - Repositórios usados dentro de `run()` precisam ler de `PrismaService.db`.
 */
export abstract class UnitOfWork {
  abstract run<T>(work: () => Promise<T>): Promise<T>;
}
