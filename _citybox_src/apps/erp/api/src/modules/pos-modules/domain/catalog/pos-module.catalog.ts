/**
 * Catálogo dos módulos do PDV que o backoffice conhece.
 *
 * ⚠️ **Espelho de `apps/pdv/app/lib/features/modules/domain/module_ids.dart`.**
 * Os ids são o contrato entre os dois pacotes, e não há como compartilhá-los:
 * um lado é TypeScript, o outro é Dart, e criar um pacote por causa de catorze
 * strings custaria mais que a duplicação. A trava é `pos-module.catalog.spec.ts`
 * aqui e `module_catalog_contract_test.dart` lá — os dois afirmam a mesma lista,
 * e um aponta para o outro.
 *
 * **Não confundir com o catálogo de módulos do `admin-api`**
 * (`store-vertical.catalog.ts`, com `kds`/`autoatendimento`/`pdv_mobile`).
 * Aquele responde "a loja pagou por isto?"; este responde "este caixa usa
 * isto?". Vocabulários e granularidades diferentes que por acaso se chamam
 * "módulos".
 */

export const POS_MODULE_STATES = ['available', 'disabled', 'blocked'] as const;
export type PosModuleStateValue = (typeof POS_MODULE_STATES)[number];

export type PosModuleCatalogItem = {
  id: string;
  label: string;
  /** Descrição para a tela de configuração — o que o gerente perde ao desligar. */
  description: string;
};

/**
 * Módulos que **não podem ser desligados**.
 *
 * São o que qualquer caixa faz, em food ou varejo: vender, identificar cliente
 * e vendedor, mexer na gaveta, consultar o que já vendeu, devolver, fiar e
 * abrir as configurações do terminal.
 * Estão listados — em vez de simplesmente ausentes — porque a resolução precisa
 * forçá-los a `available` mesmo quando alguém grava o contrário direto no
 * banco.
 */
export const POS_CORE_MODULE_IDS = [
  'counter',
  'customer',
  'seller',
  'cash_drawer',
  'cash_hub',
  'history',
  'refund',
  'credit',
  'settings',
] as const;

/**
 * O que o backoffice pode ligar e desligar.
 *
 * Só **telas de segmento** nesta fatia. Os comportamentos do Balcão (código de
 * barras, balança, meia-pizza, couvert, taxa de serviço…) existem no catálogo
 * do PDV e ficam de fora de propósito: "esta loja usa mesas?" é pergunta de
 * negócio; "o Balcão aceita meia-pizza?" depende de o produto existir. Juntar
 * as duas produz quinze chaves sem hierarquia.
 */
export const POS_OPTIONAL_MODULES: readonly PosModuleCatalogItem[] = [
  {
    id: 'tables',
    label: 'Mesas',
    description: 'Mapa de mesas do salão. Típico de restaurante.',
  },
  {
    id: 'tabs',
    label: 'Comandas',
    description: 'Consumo em aberto por comanda, fechado no fim.',
  },
  {
    id: 'service',
    label: 'Atendimentos',
    description: 'Fila de atendimentos por senha ou ordem de chegada.',
  },
  {
    // Alias interno: o PDV ainda distingue rota de montagem (`delivery`) do
    // quadro (`delivery_orders`), mas o produto é **um** módulo — o switch do
    // backoffice é só `delivery_orders`. A resolução copia o estado.
    id: 'delivery',
    label: 'Delivery (alias)',
    description:
      'Espelho de delivery_orders — não aparece no backoffice.',
  },
  {
    id: 'delivery_orders',
    label: 'Delivery',
    description:
      'Quadro de pedidos e novo pedido com endereço e taxa de entrega.',
  },
  {
    id: 'price_check',
    label: 'Consulta de preço',
    description: 'Consultar preço sem mexer no carrinho. Típico de varejo.',
  },
] as const;

export const POS_OPTIONAL_MODULE_IDS: readonly string[] =
  POS_OPTIONAL_MODULES.map((item) => item.id);

/**
 * Opcionais que o produto ainda não entrega de ponta a ponta.
 *
 * Continuam no catálogo (contrato PDV↔ERP) e no mapa resolvido, mas a
 * resolução força `disabled` e o backoffice **não oferece switch** — o mesmo
 * espírito de `credit`/`refund` no núcleo. Remover daqui quando mesas/comandas
 * tiverem sync ERP + UX pronta.
 */
export const POS_TEMPORARILY_DISABLED_MODULE_IDS = [
  'tables',
  'tabs',
] as const;

/**
 * Ids que existem no contrato/resolução mas **não** ganham switch próprio —
 * o estado vem de outro módulo (`delivery` ← `delivery_orders`).
 */
export const POS_ALIAS_OPTIONAL_MODULE_IDS = ['delivery'] as const;

const POS_HIDDEN_FROM_CONFIG_IDS: readonly string[] = [
  ...POS_TEMPORARILY_DISABLED_MODULE_IDS,
  ...POS_ALIAS_OPTIONAL_MODULE_IDS,
];

export const POS_CONFIGURABLE_OPTIONAL_MODULES: readonly PosModuleCatalogItem[] =
  POS_OPTIONAL_MODULES.filter(
    (item) => !POS_HIDDEN_FROM_CONFIG_IDS.includes(item.id),
  );

export function isCorePosModule(moduleId: string): boolean {
  return (POS_CORE_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function isKnownPosModule(moduleId: string): boolean {
  return (
    isCorePosModule(moduleId) || POS_OPTIONAL_MODULE_IDS.includes(moduleId)
  );
}
