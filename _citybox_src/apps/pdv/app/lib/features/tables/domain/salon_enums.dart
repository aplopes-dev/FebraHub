enum SalonAccountStatus { open, closing, closed }

enum DiningTableStatus { free, occupied, closing }

enum DeliveryOrderStatus {
  received,
  preparing,
  dispatched,
  delivered,
  cancelled,
}

enum SalonOrigin { table, tab, counter, delivery }

/// Como o pedido chega ao cliente.
///
/// Um pedido de "delivery" no PDV pode ser retirada no balcão — o cliente pede
/// por fora e vem buscar. É o que separa quem precisa de entregador de quem
/// não precisa, e por isso é filtro na tela de Pedidos delivery.
enum DeliveryFulfillment { delivery, pickup }

extension DeliveryFulfillmentLabel on DeliveryFulfillment {
  String get label => switch (this) {
    DeliveryFulfillment.delivery => 'Entrega',
    DeliveryFulfillment.pickup => 'Retirada',
  };
}

extension DeliveryOrderStatusLabel on DeliveryOrderStatus {
  /// Nome da coluna do Kanban a que o status pertence.
  String get boardLabel => switch (this) {
    DeliveryOrderStatus.received => 'Novo',
    DeliveryOrderStatus.preparing => 'Em preparo',
    DeliveryOrderStatus.dispatched => 'Despachado',
    DeliveryOrderStatus.delivered => 'Concluído',
    DeliveryOrderStatus.cancelled => 'Cancelado',
  };
}
