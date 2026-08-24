import 'package:citybox_pdv/features/cash/domain/sale_record.dart';

enum RefundMethod { cash, customerCredit }

class RefundLine {
  const RefundLine({
    required this.productId,
    required this.name,
    required this.quantity,
    required this.unitCents,
    required this.lineCents,
    this.skuId,
  });

  final String productId;
  final String? skuId;
  final String name;
  final int quantity;
  final int unitCents;
  final int lineCents;

  Map<String, Object?> toJson() => <String, Object?>{
    'productId': productId,
    'skuId': skuId,
    'name': name,
    'quantity': quantity,
    'unitCents': unitCents,
    'lineCents': lineCents,
  };

  static RefundLine fromJson(Map<String, dynamic> json) {
    return RefundLine(
      productId: json['productId']! as String,
      skuId: json['skuId'] as String?,
      name: json['name']! as String,
      quantity: json['quantity']! as int,
      unitCents: json['unitCents']! as int,
      lineCents: json['lineCents']! as int,
    );
  }
}

class RefundRecord {
  const RefundRecord({
    required this.id,
    required this.saleId,
    required this.shiftId,
    required this.createdAt,
    required this.lines,
    required this.totalCents,
    required this.method,
    this.customerId,
  });

  final String id;
  final String saleId;
  final String shiftId;
  final DateTime createdAt;
  final List<RefundLine> lines;
  final int totalCents;
  final RefundMethod method;
  final String? customerId;

  Map<String, Object?> toJson() => <String, Object?>{
    'id': id,
    'saleId': saleId,
    'shiftId': shiftId,
    'createdAt': createdAt.toIso8601String(),
    'lines': lines.map((RefundLine e) => e.toJson()).toList(),
    'totalCents': totalCents,
    'method': method.name,
    'customerId': customerId,
  };

  static RefundRecord fromJson(Map<String, dynamic> json) {
    final List<dynamic> raw =
        (json['lines'] as List<dynamic>?) ?? const <dynamic>[];
    return RefundRecord(
      id: json['id']! as String,
      saleId: json['saleId']! as String,
      shiftId: json['shiftId']! as String,
      createdAt: DateTime.parse(json['createdAt']! as String),
      lines:
          raw
              .map(
                (dynamic e) =>
                    RefundLine.fromJson(Map<String, dynamic>.from(e as Map)),
              )
              .toList(),
      totalCents: json['totalCents']! as int,
      method: RefundMethod.values.byName(json['method']! as String),
      customerId: json['customerId'] as String?,
    );
  }
}

/// Quantidade ainda elegível para devolução numa linha de venda.
int eligibleQty({
  required SaleLineSnapshot line,
  required List<RefundRecord> priorRefunds,
  required String saleId,
}) {
  int returned = 0;
  for (final RefundRecord r in priorRefunds) {
    if (r.saleId != saleId) {
      continue;
    }
    for (final RefundLine rl in r.lines) {
      if (rl.productId == line.productId) {
        returned += rl.quantity;
      }
    }
  }
  final int left = line.quantity - returned;
  return left < 0 ? 0 : left;
}
