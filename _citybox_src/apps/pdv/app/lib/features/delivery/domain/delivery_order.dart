import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

class DeliveryOrder {
  const DeliveryOrder({
    required this.id,
    required this.status,
    required this.addressText,
    required this.feeCents,
    required this.createdAt,
    required this.updatedAt,
    this.number = 0,
    this.fulfillment = DeliveryFulfillment.delivery,
    this.customerId,
    this.customerName,
    this.courierId,
    this.courierName,
    this.accountId,
    this.saleOrderId,
    this.goodsTotalCents = 0,
    this.totalCents = 0,
  });

  final String id;
  final DeliveryOrderStatus status;

  /// Sequência do pedido no terminal, começando em 1. Atribuída pelo salão em
  /// `createDeliveryOrder` — o pedido não escolhe o próprio número. `0` =
  /// pedido gravado antes deste campo existir; a tabela mostra traço.
  final int number;

  /// Entrega ou retirada. Default `delivery` — pedido gravado antes deste
  /// campo existir era, por definição, entrega: retirada não tinha como ser
  /// registrada.
  final DeliveryFulfillment fulfillment;

  final String? customerId;
  final String? customerName;
  final String addressText;
  final int feeCents;
  final String? courierId;
  final String? courierName;
  final String? accountId;

  /// Venda ativa vinculada (`POST /v1/pos/sales`). Pagamento ≠ Concluído.
  final String? saleOrderId;
  final DateTime createdAt;
  final DateTime updatedAt;

  /// Soma dos itens (sem taxa de entrega), em centavos.
  final int goodsTotalCents;

  /// Itens + taxa de entrega, em centavos.
  final int totalCents;

  bool get isPaid => saleOrderId != null && saleOrderId!.isNotEmpty;

  DeliveryOrder copyWith({
    DeliveryOrderStatus? status,
    int? number,
    DeliveryFulfillment? fulfillment,
    String? accountId,
    String? courierId,
    String? courierName,
    DateTime? updatedAt,
    int? feeCents,
    int? goodsTotalCents,
    int? totalCents,
    String? customerId,
    String? customerName,
    String? addressText,
    String? saleOrderId,
    bool clearSaleOrderId = false,
  }) {
    return DeliveryOrder(
      id: id,
      status: status ?? this.status,
      number: number ?? this.number,
      fulfillment: fulfillment ?? this.fulfillment,
      customerId: customerId ?? this.customerId,
      customerName: customerName ?? this.customerName,
      addressText: addressText ?? this.addressText,
      feeCents: feeCents ?? this.feeCents,
      courierId: courierId ?? this.courierId,
      courierName: courierName ?? this.courierName,
      accountId: accountId ?? this.accountId,
      saleOrderId: clearSaleOrderId ? null : (saleOrderId ?? this.saleOrderId),
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      goodsTotalCents: goodsTotalCents ?? this.goodsTotalCents,
      totalCents: totalCents ?? this.totalCents,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'status': status.name,
    'number': number,
    'fulfillment': fulfillment.name,
    'customerId': customerId,
    'customerName': customerName,
    'addressText': addressText,
    'feeCents': feeCents,
    'courierId': courierId,
    'courierName': courierName,
    'accountId': accountId,
    'saleOrderId': saleOrderId,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
    'goodsTotalCents': goodsTotalCents,
    'totalCents': totalCents,
  };

  static DeliveryOrder fromJson(Map<String, dynamic> json) {
    final int fee = (json['feeCents'] as num?)?.toInt() ?? 0;
    final int goods = (json['goodsTotalCents'] as num?)?.toInt() ?? 0;
    final int? storedTotal = (json['totalCents'] as num?)?.toInt();
    final String? saleId = json['saleOrderId'] as String?;
    return DeliveryOrder(
      id: json['id']! as String,
      status: DeliveryOrderStatus.values.byName(json['status']! as String),
      number: (json['number'] as int?) ?? 0,
      fulfillment:
          json['fulfillment'] == null
              ? DeliveryFulfillment.delivery
              : DeliveryFulfillment.values.byName(
                json['fulfillment']! as String,
              ),
      customerId: json['customerId'] as String?,
      customerName: json['customerName'] as String?,
      addressText: json['addressText']! as String,
      feeCents: fee,
      courierId: json['courierId'] as String?,
      courierName: json['courierName'] as String?,
      accountId: json['accountId'] as String?,
      saleOrderId: (saleId != null && saleId.isNotEmpty) ? saleId : null,
      createdAt: DateTime.parse(json['createdAt']! as String),
      updatedAt: DateTime.parse(json['updatedAt']! as String),
      goodsTotalCents: goods,
      totalCents: storedTotal ?? goods + fee,
    );
  }
}

/// Totais do pedido a partir das linhas + taxa (função pura).
({int goodsTotalCents, int totalCents}) deliveryTotalsFromLines(
  List<CounterCartLine> lines,
  int feeCents,
) {
  final int goods = lines.fold<int>(
    0,
    (int sum, CounterCartLine line) => sum + line.totalCents,
  );
  final int fee = feeCents < 0 ? 0 : feeCents;
  return (goodsTotalCents: goods, totalCents: goods + fee);
}

/// O espelho ERP achata addons/meia/peso. Se o PDV ainda tem linhas mais
/// ricas para os mesmos produtos, mantém as locais no poll.
List<CounterCartLine> preferRicherCartLines({
  required List<CounterCartLine>? local,
  required List<CounterCartLine> remote,
}) {
  if (local == null || local.isEmpty) {
    return remote;
  }
  if (remote.isEmpty) {
    return local;
  }
  if (local.length != remote.length) {
    return remote;
  }
  for (int i = 0; i < local.length; i++) {
    if (local[i].product.id != remote[i].product.id) {
      return remote;
    }
  }
  final int localScore = local.fold<int>(
    0,
    (int s, CounterCartLine l) => s + _cartLineRichness(l),
  );
  final int remoteScore = remote.fold<int>(
    0,
    (int s, CounterCartLine l) => s + _cartLineRichness(l),
  );
  return localScore > remoteScore ? local : remote;
}

int _cartLineRichness(CounterCartLine line) {
  int score = 0;
  if (line.addons.isNotEmpty) score += 2 + line.addons.length;
  if (line.half != null) score += 3;
  if (line.weightKg != null) score += 2;
  if (line.kitchenNote != null && line.kitchenNote!.trim().isNotEmpty) {
    score += 1;
  }
  if (line.skuId != null) score += 1;
  return score;
}
