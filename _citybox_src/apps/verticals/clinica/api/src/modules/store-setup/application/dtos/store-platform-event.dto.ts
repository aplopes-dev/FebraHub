/**
 * Contrato de evento vindo do platform-api.
 *
 * Reexporta de `@citybox/messaging` — antes este arquivo tinha uma cópia própria do tipo,
 * já divergida do produtor (faltavam `owner`, `plan` e `status`). Nunca redeclarar aqui.
 */
export type {
  StorePlatformEventAddress,
  StorePlatformEventData,
  StorePlatformEventOwnerData,
  StorePlatformEventPlanData,
  StorePlatformEventStatus,
  StorePlatformVertical,
} from '@citybox/messaging';
