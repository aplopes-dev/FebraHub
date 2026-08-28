/**
 * `mock-db` — o banco de demonstração do Comercial.
 *
 * Um dado só para todas as telas do módulo: mover card no funil aparece na
 * ficha, ganhar oportunidade gera venda em `/comercial/vendas`, matricular na
 * sala move o contador da edição. É o que faz a demonstração se sustentar como
 * sistema, e não como cinco telas desconexas.
 *
 * **Onde ele mora e por quê.** Fica em `src/lib` (infra compartilhada), não
 * dentro de uma feature: `apps/web/AGENTS.md` proíbe uma feature importar de
 * outra, e cinco features precisam do mesmo dado.
 *
 * **Vida útil.** Tudo aqui é memória do processo: recarregar a página perde as
 * alterações. É de propósito — quando o `apps/api` expuser o comercial, cada
 * `services/*.service.ts` das features troca a chamada local por `apiFetch` e
 * esta pasta some inteira.
 */

export * from "@/lib/mock-db/types";
export * from "@/lib/mock-db/lcg";
export * from "@/lib/mock-db/catalog";
export * from "@/lib/mock-db/editions";
export * from "@/lib/mock-db/people";
export * from "@/lib/mock-db/pipeline";
export * from "@/lib/mock-db/sales";
export * from "@/lib/mock-db/room";
export * from "@/lib/mock-db/leads";
export * from "@/lib/mock-db/operations";
