import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';

class SaleLineSnapshot {
  const SaleLineSnapshot({
    required this.productId,
    required this.name,
    required this.quantity,
    required this.unitPriceCents,
    required this.lineTotalCents,
    this.kitchenNote,
    this.addonLabels = const <String>[],
    this.halfLabel,
  });

  final String productId;
  final String name;
  final int quantity;
  final int unitPriceCents;
  final int lineTotalCents;
  final String? kitchenNote;
  final List<String> addonLabels;
  final String? halfLabel;

  Map<String, Object?> toJson() => <String, Object?>{
    'productId': productId,
    'name': name,
    'quantity': quantity,
    'unitPriceCents': unitPriceCents,
    'lineTotalCents': lineTotalCents,
    'kitchenNote': kitchenNote,
    'addonLabels': addonLabels,
    'halfLabel': halfLabel,
  };

  static SaleLineSnapshot fromJson(Map<String, dynamic> json) {
    final List<dynamic> rawAddons =
        (json['addonLabels'] as List<dynamic>?) ?? const <dynamic>[];
    return SaleLineSnapshot(
      productId: json['productId']! as String,
      name: json['name']! as String,
      quantity: json['quantity']! as int,
      unitPriceCents: json['unitPriceCents']! as int,
      lineTotalCents: json['lineTotalCents']! as int,
      kitchenNote: json['kitchenNote'] as String?,
      addonLabels: rawAddons.map((dynamic e) => e as String).toList(),
      halfLabel: json['halfLabel'] as String?,
    );
  }
}

class SalePaymentSnapshot {
  const SalePaymentSnapshot({
    required this.methodId,
    required this.methodLabel,
    required this.amountCents,
    this.systemKey,
    this.brand,
    this.installments = 1,
  });

  final String methodId;
  final String methodLabel;
  final int amountCents;
  final String? systemKey;
  final String? brand;
  final int installments;

  bool get isCash =>
      systemKey == 'pm-dinheiro' || methodId == 'cash' || systemKey == 'cash';

  Map<String, Object?> toJson() => <String, Object?>{
    'methodId': methodId,
    'methodLabel': methodLabel,
    'amountCents': amountCents,
    'systemKey': systemKey,
    'brand': brand,
    'installments': installments,
  };

  static SalePaymentSnapshot fromJson(Map<String, dynamic> json) {
    return SalePaymentSnapshot(
      methodId: json['methodId']! as String,
      methodLabel: json['methodLabel']! as String,
      amountCents: json['amountCents']! as int,
      systemKey: json['systemKey'] as String?,
      brand: json['brand'] as String?,
      installments: (json['installments'] as int?) ?? 1,
    );
  }
}

class SaleRecord {
  const SaleRecord({
    required this.id,
    required this.shiftId,
    required this.status,
    required this.createdAt,
    required this.lines,
    required this.payments,
    required this.subtotalCents,
    required this.totalCents,
    required this.cashReceivedCents,
    required this.changeCents,
    required this.cashNetCents,
    this.number = 0,
    this.customerId,
    this.customerName,
    this.consumerDocument,
    this.serverSaleId,
    this.serverNumber,
    this.operatorId,
    this.operatorName,
    this.cancelledAt,
    this.cancellationAuthorizedByOperatorId,
    this.cancellationAuthorizedByOperatorName,
    this.sellerId,
    this.sellerName,
    this.note,
    this.saleAdjustment,
    this.couvertCents = 0,
    this.serviceFeeCents = 0,
    this.deliveryFeeCents = 0,
  });

  /// Número para UI: ERP ([serverNumber]) quando existir, senão o do turno.
  ///
  /// `null` = venda antiga sem numeração — a UI mostra traço.
  static int? displayNumber(SaleRecord sale) =>
      sale.serverNumber ?? (sale.number > 0 ? sale.number : null);

  /// Rótulo `#123` ou `—` quando não há número.
  static String displayNumberLabel(SaleRecord sale) {
    final int? n = displayNumber(sale);
    return n == null ? '—' : '#$n';
  }

  final String id;

  /// Sequência da venda **dentro do turno**, começando em 1.
  ///
  /// Quem atribui é `CashShiftController.recordSale` — a venda não escolhe o
  /// próprio número, senão duas telas registrando ao mesmo tempo repetiriam.
  /// `0` = venda gravada antes deste campo existir (ver [fromJson]); a UI
  /// mostra traço nesse caso, em vez de um "0" que parece número de verdade.
  final int number;

  /// Id do cliente CRM (quando a venda não é consumidor final).
  final String? customerId;

  /// Nome do cliente no momento da venda — snapshot, não referência.
  ///
  /// `null` = Consumidor Final (nenhum cliente escolhido no Balcão). Guardado
  /// por cópia porque o histórico tem que continuar mostrando o que foi
  /// vendido para quem, mesmo que o cadastro do cliente mude depois.
  final String? customerName;

  /// CPF/CNPJ na nota (só dígitos). Null = sem identificação no cupom.
  final String? consumerDocument;

  /// Id do `SaleOrder` no ERP (quando sincronizado online).
  final String? serverSaleId;

  /// Número sequencial do `SaleOrder` no ERP (organização).
  final int? serverNumber;

  /// Quem **digitou** a venda — auditoria, não comissão.
  ///
  /// Distinto de [sellerId]/[sellerName], que é de quem é a venda para efeito
  /// de comissão. No balcão costumam ser a mesma pessoa; em loja com equipe de
  /// vendas, não são. Quem atribui é `CashShiftController.recordSale`, a partir
  /// do turno — a venda não escolhe o próprio operador, pelo mesmo motivo de
  /// não escolher o próprio número.
  ///
  /// Nulo só em venda gravada antes destes campos existirem (ver [fromJson]).
  final String? operatorId;
  final String? operatorName;

  final String shiftId;
  final SaleRecordStatus status;
  final DateTime createdAt;
  final DateTime? cancelledAt;

  /// Supervisor que liberou o **cancelamento**.
  ///
  /// Nome longo de propósito. Um `authorizedBy` genérico aqui colidiria com a
  /// autorização do desconto, que mora em [saleAdjustment]: a mesma venda pode
  /// ter as duas exceções, cada uma com um responsável diferente, e um par de
  /// campos só guardaria a última — apagando quem liberou a primeira.
  ///
  /// `null` = cancelamento que não exigia supervisor, ou venda não cancelada.
  final String? cancellationAuthorizedByOperatorId;
  final String? cancellationAuthorizedByOperatorName;

  final List<SaleLineSnapshot> lines;
  final List<SalePaymentSnapshot> payments;
  final String? sellerId;
  final String? sellerName;
  final String? note;
  final int subtotalCents;
  final SaleAdjustment? saleAdjustment;
  final int totalCents;
  final int cashReceivedCents;
  final int changeCents;
  final int cashNetCents;
  final int couvertCents;
  final int serviceFeeCents;
  final int deliveryFeeCents;

  SaleRecord copyWith({
    SaleRecordStatus? status,
    DateTime? cancelledAt,
    String? cancellationAuthorizedByOperatorId,
    String? cancellationAuthorizedByOperatorName,
    int? number,
    String? operatorId,
    String? operatorName,
  }) {
    return SaleRecord(
      id: id,
      number: number ?? this.number,
      customerId: customerId,
      customerName: customerName,
      consumerDocument: consumerDocument,
      serverSaleId: serverSaleId,
      serverNumber: serverNumber,
      operatorId: operatorId ?? this.operatorId,
      operatorName: operatorName ?? this.operatorName,
      shiftId: shiftId,
      status: status ?? this.status,
      createdAt: createdAt,
      cancelledAt: cancelledAt ?? this.cancelledAt,
      cancellationAuthorizedByOperatorId:
          cancellationAuthorizedByOperatorId ??
          this.cancellationAuthorizedByOperatorId,
      cancellationAuthorizedByOperatorName:
          cancellationAuthorizedByOperatorName ??
          this.cancellationAuthorizedByOperatorName,
      lines: lines,
      payments: payments,
      sellerId: sellerId,
      sellerName: sellerName,
      note: note,
      subtotalCents: subtotalCents,
      saleAdjustment: saleAdjustment,
      totalCents: totalCents,
      cashReceivedCents: cashReceivedCents,
      changeCents: changeCents,
      cashNetCents: cashNetCents,
      couvertCents: couvertCents,
      serviceFeeCents: serviceFeeCents,
      deliveryFeeCents: deliveryFeeCents,
    );
  }

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'number': number,
    'customerId': customerId,
    'customerName': customerName,
    'consumerDocument': consumerDocument,
    'serverSaleId': serverSaleId,
    'serverNumber': serverNumber,
    'operatorId': operatorId,
    'operatorName': operatorName,
    'shiftId': shiftId,
    'status': status.name,
    'createdAt': createdAt.toIso8601String(),
    'cancelledAt': cancelledAt?.toIso8601String(),
    'cancellationAuthorizedByOperatorId': cancellationAuthorizedByOperatorId,
    'cancellationAuthorizedByOperatorName':
        cancellationAuthorizedByOperatorName,
    'lines': lines.map((SaleLineSnapshot e) => e.toJson()).toList(),
    'payments': payments.map((SalePaymentSnapshot e) => e.toJson()).toList(),
    'sellerId': sellerId,
    'sellerName': sellerName,
    'note': note,
    'subtotalCents': subtotalCents,
    'saleAdjustment': saleAdjustment?.toJson(),
    'totalCents': totalCents,
    'cashReceivedCents': cashReceivedCents,
    'changeCents': changeCents,
    'cashNetCents': cashNetCents,
    'couvertCents': couvertCents,
    'serviceFeeCents': serviceFeeCents,
    'deliveryFeeCents': deliveryFeeCents,
  };

  static SaleRecord fromJson(Map<String, dynamic> json) {
    final List<dynamic> linesRaw = json['lines']! as List<dynamic>;
    final List<dynamic> paymentsRaw = json['payments']! as List<dynamic>;
    final Object? adj = json['saleAdjustment'];
    return SaleRecord(
      id: json['id']! as String,
      number: (json['number'] as int?) ?? 0,
      customerId: json['customerId'] as String?,
      customerName: json['customerName'] as String?,
      consumerDocument: json['consumerDocument'] as String?,
      serverSaleId: json['serverSaleId'] as String?,
      serverNumber: json['serverNumber'] as int?,
      operatorId: json['operatorId'] as String?,
      operatorName: json['operatorName'] as String?,
      shiftId: json['shiftId']! as String,
      status: SaleRecordStatus.values.byName(json['status']! as String),
      createdAt: DateTime.parse(json['createdAt']! as String),
      cancelledAt:
          json['cancelledAt'] != null
              ? DateTime.parse(json['cancelledAt']! as String)
              : null,
      cancellationAuthorizedByOperatorId:
          json['cancellationAuthorizedByOperatorId'] as String?,
      cancellationAuthorizedByOperatorName:
          json['cancellationAuthorizedByOperatorName'] as String?,
      lines:
          linesRaw
              .map(
                (dynamic e) =>
                    SaleLineSnapshot.fromJson(e as Map<String, dynamic>),
              )
              .toList(),
      payments:
          paymentsRaw
              .map(
                (dynamic e) =>
                    SalePaymentSnapshot.fromJson(e as Map<String, dynamic>),
              )
              .toList(),
      sellerId: json['sellerId'] as String?,
      sellerName: json['sellerName'] as String?,
      note: json['note'] as String?,
      subtotalCents: json['subtotalCents']! as int,
      saleAdjustment:
          adj is Map<String, dynamic> ? SaleAdjustment.fromJson(adj) : null,
      totalCents: json['totalCents']! as int,
      cashReceivedCents: json['cashReceivedCents']! as int,
      changeCents: json['changeCents']! as int,
      cashNetCents: json['cashNetCents']! as int,
      couvertCents: (json['couvertCents'] as int?) ?? 0,
      serviceFeeCents: (json['serviceFeeCents'] as int?) ?? 0,
      deliveryFeeCents: (json['deliveryFeeCents'] as int?) ?? 0,
    );
  }
}
