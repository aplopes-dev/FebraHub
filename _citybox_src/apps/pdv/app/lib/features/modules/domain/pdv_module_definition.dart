import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// Entrada imutável do catálogo de módulos.
class PdvModuleDefinition {
  const PdvModuleDefinition({
    required this.id,
    required this.kind,
    required this.tier,
    required this.label,
    this.segmentHint,
  });

  final String id;
  final PdvModuleKind kind;
  final PdvModuleTier tier;
  final String label;

  /// `food` | `retail` | `both` — documentação/fixture; não substitui [tier].
  final String? segmentHint;

  bool get isCore => tier == PdvModuleTier.core;
}

/// Catálogo completo: telas existentes + comportamentos de segmento (FR-001).
const List<PdvModuleDefinition> pdvModuleCatalog = <PdvModuleDefinition>[
  // --- Núcleo (⬛) ---------------------------------------------------------
  PdvModuleDefinition(
    id: PdvModuleIds.counter,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Balcão',
    segmentHint: 'both',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.customer,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Cliente',
    segmentHint: 'both',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.seller,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Vendedor',
    segmentHint: 'both',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.cashDrawer,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Sangria / reforço',
    segmentHint: 'both',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.cashHub,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Caixa',
    segmentHint: 'both',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.history,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Últimas vendas',
    segmentHint: 'both',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.refund,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Devolução',
    segmentHint: 'both',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.credit,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Crédito dos clientes',
    segmentHint: 'both',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.settings,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.core,
    label: 'Configurações',
    segmentHint: 'both',
  ),

  // --- Opcionais food (🍽) -------------------------------------------------
  PdvModuleDefinition(
    id: PdvModuleIds.tables,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.optional,
    label: 'Mesas',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.tabs,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.optional,
    label: 'Comandas',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.service,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.optional,
    label: 'Atendimentos',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.delivery,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.optional,
    label: 'Delivery (alias)',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.deliveryOrders,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.optional,
    label: 'Delivery',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.itemAddon,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Adicional / opcional',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.kitchenNote,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Observação de cozinha',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.halfPizza,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Meia-a-meia',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.productionPrint,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Impressão de produção',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.serviceFee,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Taxa de serviço',
    segmentHint: 'food',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.couvert,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Couvert / entrada',
    segmentHint: 'food',
  ),

  // --- Opcionais varejo (🏬) -----------------------------------------------
  PdvModuleDefinition(
    id: PdvModuleIds.priceCheck,
    kind: PdvModuleKind.screen,
    tier: PdvModuleTier.optional,
    label: 'Consulta de preço',
    segmentHint: 'retail',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.barcode,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Código de barras',
    segmentHint: 'retail',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.scale,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Balança / peso',
    segmentHint: 'retail',
  ),
  PdvModuleDefinition(
    id: PdvModuleIds.variantGrid,
    kind: PdvModuleKind.behavior,
    tier: PdvModuleTier.optional,
    label: 'Grade / variação',
    segmentHint: 'retail',
  ),
];

/// Lookup por id — O(n) no catálogo pequeno; evita map global mutável.
PdvModuleDefinition? findModuleDefinition(String id) {
  for (final PdvModuleDefinition def in pdvModuleCatalog) {
    if (def.id == id) {
      return def;
    }
  }
  return null;
}

List<PdvModuleDefinition> get coreModuleDefinitions => pdvModuleCatalog
    .where((PdvModuleDefinition d) => d.isCore)
    .toList(growable: false);
