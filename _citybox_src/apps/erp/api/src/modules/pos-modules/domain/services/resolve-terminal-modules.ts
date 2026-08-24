import {
  isCorePosModule,
  POS_CORE_MODULE_IDS,
  POS_OPTIONAL_MODULE_IDS,
  POS_TEMPORARILY_DISABLED_MODULE_IDS,
  type PosModuleStateValue,
} from '../catalog/pos-module.catalog';

export type PosModuleStateMap = Record<string, PosModuleStateValue>;

/**
 * Mescla o padrão da loja com a sobrescrita do terminal.
 *
 * **Único lugar do sistema que mescla.** A rota do device devolve o resultado
 * disto, nunca as duas camadas separadas — se o PDV recebesse os ingredientes,
 * teria de reimplementar a receita, e uma divergência ali produziria um terminal
 * mostrando mesa que o ERP diz estar desligada.
 *
 * Três regras, nesta ordem:
 *
 * 1. **Núcleo é inegociável.** Sai `available` mesmo que o banco diga o
 *    contrário. Não é desconfiança do PDV — é que a tela do backoffice não pode
 *    oferecer um switch sem efeito, e um valor gravado à mão não pode virar um
 *    caixa que não fecha.
 * 2. **`overrides === null` significa herdar**, e continuar herdando quando o
 *    padrão mudar. Distinto de `{}`, que seria "configurei e não liguei nada".
 * 3. **Id desconhecido é descartado.** Módulo removido do catálogo ou digitado
 *    errado não vira estado — o mapa de saída tem exatamente o catálogo.
 */
export function resolveTerminalModules(
  defaults: PosModuleStateMap,
  overrides: PosModuleStateMap | null,
): PosModuleStateMap {
  const resolved: PosModuleStateMap = {};

  for (const moduleId of POS_CORE_MODULE_IDS) {
    resolved[moduleId] = 'available';
  }

  for (const moduleId of POS_OPTIONAL_MODULE_IDS) {
    const fromOverride = overrides?.[moduleId];
    const fromDefault = defaults[moduleId];
    // Ausente nos dois → `available`. Erra para o lado de mostrar: um módulo
    // que aparece sem precisar é ruído; um que some sem ninguém ter desligado é
    // chamado de suporte.
    resolved[moduleId] = fromOverride ?? fromDefault ?? 'available';
  }

  // Crédito e devolução ainda são só locais no app PDV — forçar desligado
  // até existirem APIs POS. Remover quando `CancelPosSale`/refund/credit
  // estiverem completos no servidor (crédito/devolução).
  resolved.credit = 'disabled';
  resolved.refund = 'disabled';

  // Mesas e comandas: UI local sem sync ERP — forçar desligado até a feature
  // existir de ponta a ponta. Remover quando salão/comanda forem entregues.
  for (const moduleId of POS_TEMPORARILY_DISABLED_MODULE_IDS) {
    resolved[moduleId] = 'disabled';
  }

  // Um produto Delivery: o quadro (`delivery_orders`) manda; `delivery` (rota
  // de novo pedido no PDV) espelha. Evita dois switches no ERP e estados
  // divergentes no terminal.
  resolved.delivery = resolved.delivery_orders;

  return resolved;
}

/**
 * Limpa um mapa vindo de fora (corpo de requisição ou coluna `Json`).
 *
 * Descarta id desconhecido e **remove o núcleo**: guardar `cash_hub: disabled`
 * seria persistir uma intenção que a resolução ignora, e alguém lendo a linha
 * do banco acreditaria nela.
 */
export function sanitizeModuleStates(
  input: Record<string, unknown> | null | undefined,
): PosModuleStateMap {
  if (!input) return {};

  const clean: PosModuleStateMap = {};
  for (const moduleId of POS_OPTIONAL_MODULE_IDS) {
    const value = input[moduleId];
    if (value === 'available' || value === 'disabled' || value === 'blocked') {
      clean[moduleId] = value;
    }
  }

  // Persistir o alias junto: toggle só de `delivery_orders` no backoffice
  // não pode deixar `delivery` antigo no Json.
  if (clean.delivery_orders !== undefined) {
    clean.delivery = clean.delivery_orders;
  } else if (clean.delivery !== undefined) {
    clean.delivery_orders = clean.delivery;
  }

  return clean;
}

/** `true` se o mapa tenta desligar algum módulo de núcleo. */
export function attemptsToDisableCore(
  input: Record<string, unknown> | null | undefined,
): boolean {
  if (!input) return false;
  return Object.entries(input).some(
    ([moduleId, value]) => isCorePosModule(moduleId) && value !== 'available',
  );
}
