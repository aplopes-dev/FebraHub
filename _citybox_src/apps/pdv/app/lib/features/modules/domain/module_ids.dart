/// Identificadores estáveis dos módulos do PDV.
///
/// Cada valor aqui é a chave que o catálogo e `moduleVisibilityProvider`
/// usam. Qualquer parte do app que precise saber se um módulo está ligado —
/// bloco da Home, atalho, botão na app bar, bloco de comportamento no Balcão —
/// lê o mesmo id daqui.
abstract final class PdvModuleIds {
  // --- Telas / ações -------------------------------------------------------
  static const String counter = 'counter';
  static const String customer = 'customer';
  static const String tables = 'tables';
  static const String service = 'service';
  static const String tabs = 'tabs';
  static const String seller = 'seller';
  static const String delivery = 'delivery';
  static const String credit = 'credit';
  static const String history = 'history';
  static const String refund = 'refund';
  static const String deliveryOrders = 'delivery_orders';
  static const String cashDrawer = 'cash_drawer';
  static const String cashHub = 'cash_hub';
  static const String settings = 'settings';
  static const String priceCheck = 'price_check';

  // --- Comportamentos (Balcão / totais) ------------------------------------
  static const String barcode = 'barcode';
  static const String scale = 'scale';
  static const String variantGrid = 'variant_grid';
  static const String itemAddon = 'item_addon';
  static const String kitchenNote = 'kitchen_note';
  static const String halfPizza = 'half_pizza';
  static const String productionPrint = 'production_print';
  static const String serviceFee = 'service_fee';
  static const String couvert = 'couvert';
}
