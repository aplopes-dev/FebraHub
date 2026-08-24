import type {
  SeedContractStatus,
  SeedServiceOrderStatus,
} from './seed-template.types';

/**
 * `ServiceOrder.statusId` é FK obrigatória. Estes cinco espelham os `baseType` do domínio —
 * até aqui eram criados sob demanda na primeira listagem, o que só funcionava se alguém
 * abrisse a tela antes de criar a primeira OS.
 */
export const SEED_SERVICE_ORDER_STATUSES: readonly SeedServiceOrderStatus[] = [
  { systemKey: 'aberta', name: 'Aberta', baseType: 'open', sortOrder: 0 },
  {
    systemKey: 'em-andamento',
    name: 'Em andamento',
    baseType: 'in_progress',
    sortOrder: 1,
  },
  { systemKey: 'pronta', name: 'Pronta', baseType: 'ready', sortOrder: 2 },
  { systemKey: 'fechada', name: 'Fechada', baseType: 'closed', sortOrder: 3 },
  {
    systemKey: 'cancelada',
    name: 'Cancelada',
    baseType: 'canceled',
    sortOrder: 4,
  },
] as const;

/**
 * `SalesContract.statusId` também é FK obrigatória, e nada provisionava estes status —
 * contrato de venda era impossível de criar em organização nova.
 */
export const SEED_CONTRACT_STATUSES: readonly SeedContractStatus[] = [
  { systemKey: 'em-negociacao', name: 'Em negociação', sortOrder: 0 },
  { systemKey: 'ativo', name: 'Ativo', sortOrder: 1 },
  { systemKey: 'suspenso', name: 'Suspenso', sortOrder: 2 },
  { systemKey: 'encerrado', name: 'Encerrado', sortOrder: 3 },
  { systemKey: 'cancelado', name: 'Cancelado', sortOrder: 4 },
] as const;
