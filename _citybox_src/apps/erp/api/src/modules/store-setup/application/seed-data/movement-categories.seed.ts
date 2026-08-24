import type { SeedMovementCategory } from './seed-template.types';

/**
 * Categorias de movimentação provisionadas em toda organização.
 *
 * São apenas o ponto de partida do select de **lançamento manual** — nenhum fluxo automático
 * depende delas desde que o motivo virou o enum `StockMovementReason` (derivado de
 * `sourceType` + `type`). O operador pode criar as suas próprias livremente.
 *
 * Os códigos não são contíguos porque `ajuste-entrada` e `venda` entraram depois, e mudar o
 * código de uma categoria já em uso confundiria quem opera pelo relatório.
 */
export const SEED_MOVEMENT_CATEGORIES: readonly SeedMovementCategory[] = [
  {
    systemKey: 'ajuste-saida',
    code: 'CM-001',
    name: 'Ajuste de estoque (saída)',
    type: 'saida',
  },
  {
    systemKey: 'quebra',
    code: 'CM-002',
    name: 'Quebra / Avaria',
    type: 'saida',
  },
  {
    systemKey: 'desperdicio',
    code: 'CM-003',
    name: 'Desperdício',
    type: 'saida',
  },
  {
    systemKey: 'entrada-avulsa',
    code: 'CM-004',
    name: 'Entrada avulsa',
    type: 'entrada',
  },
  {
    systemKey: 'devolucao',
    code: 'CM-005',
    name: 'Devolução de cliente',
    type: 'entrada',
  },
  {
    systemKey: 'consumo-interno',
    code: 'CM-006',
    name: 'Consumo interno',
    type: 'saida',
  },
  {
    systemKey: 'transferencia-saida',
    code: 'CM-007',
    name: 'Transferência (saída)',
    type: 'saida',
  },
  {
    systemKey: 'transferencia-entrada',
    code: 'CM-008',
    name: 'Transferência (entrada)',
    type: 'entrada',
  },
  {
    systemKey: 'ajuste-entrada',
    code: 'CM-011',
    name: 'Ajuste de estoque (entrada)',
    type: 'entrada',
  },
  { systemKey: 'venda', code: 'CM-012', name: 'Venda', type: 'saida' },
] as const;
