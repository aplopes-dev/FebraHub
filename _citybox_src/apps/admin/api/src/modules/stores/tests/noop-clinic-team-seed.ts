import type { SeedClinicDemoTeamUseCase } from '../application/use-cases/seed-clinic-demo-team/seed-clinic-demo-team.use-case';

/**
 * Dublê do seed de equipe demo da clínica para specs de `CreateStoreUseCase`.
 * O seed real fala com Keycloak/platform e não interessa a nenhum destes testes.
 */
export function createNoopClinicTeamSeed(): SeedClinicDemoTeamUseCase {
  return {
    execute: async () => ({ createdUsernames: [], skippedUsernames: [] }),
  } as unknown as SeedClinicDemoTeamUseCase;
}
