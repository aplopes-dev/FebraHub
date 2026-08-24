/**
 * A checagem de "a unidade pertence à organização ativa" é idêntica à usada
 * por `suppliers` — reexportar evita duas implementações da mesma regra
 * divergindo com o tempo (ver `SuppliersModule`/`CarriersModule`, ambos
 * dependentes de `TenancyModule`).
 */
export { assertBranchesBelongToOrganization } from '../../../suppliers/application/use-cases/assert-branches-belong-to-organization';
