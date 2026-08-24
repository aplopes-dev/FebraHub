import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';

/// Contagens declaradas no fechamento (cinco canais).
class CashCloseCounts {
  const CashCloseCounts({
    required this.countedCashCents,
    required this.countedCreditCents,
    required this.countedDebitCents,
    required this.countedVoucherCents,
    required this.countedOtherCents,
  });

  final int countedCashCents;
  final int countedCreditCents;
  final int countedDebitCents;
  final int countedVoucherCents;
  final int countedOtherCents;

  Map<String, int> toJson() => <String, int>{
    'countedCashCents': countedCashCents,
    'countedCreditCents': countedCreditCents,
    'countedDebitCents': countedDebitCents,
    'countedVoucherCents': countedVoucherCents,
    'countedOtherCents': countedOtherCents,
  };
}

/// Sessão remota (`GET/POST /v1/pos/cash-sessions`).
class PosCashSessionDto {
  const PosCashSessionDto({
    required this.id,
    required this.status,
    required this.openedAt,
    required this.openingFloatCents,
    required this.openedByUserId,
    required this.openedByName,
    this.closedAt,
    this.countedCashCents,
    this.differenceCashCents,
  });

  final String id;
  final String status;
  final DateTime openedAt;
  final DateTime? closedAt;
  final int openingFloatCents;
  final String openedByUserId;
  final String openedByName;
  final int? countedCashCents;
  final int? differenceCashCents;

  factory PosCashSessionDto.fromJson(Map<String, dynamic> json) {
    return PosCashSessionDto(
      id: json['id']! as String,
      status: json['status']! as String,
      openedAt: DateTime.parse(json['openedAt']! as String),
      closedAt:
          json['closedAt'] != null
              ? DateTime.parse(json['closedAt']! as String)
              : null,
      openingFloatCents: json['openingFloatCents']! as int,
      openedByUserId: json['openedByUserId']! as String,
      openedByName: json['openedByName']! as String,
      countedCashCents: json['countedCashCents'] as int?,
      differenceCashCents: json['differenceCashCents'] as int?,
    );
  }

  /// Mapeia para o domínio local. [sales]/[movements]/[numberingResetAt] vêm
  /// do cache quando o id bate — a API de current não embute esses campos.
  CashShift toCashShift({
    List<CashMovement> movements = const <CashMovement>[],
    List<SaleRecord> sales = const <SaleRecord>[],
    DateTime? numberingResetAt,
  }) {
    return CashShift(
      id: id,
      status:
          status == 'closed' ? CashShiftStatus.closed : CashShiftStatus.open,
      openedAt: openedAt,
      closedAt: closedAt,
      openingFloatCents: openingFloatCents,
      openedByOperatorId: openedByUserId,
      openedByOperatorName: openedByName,
      countedCents: countedCashCents,
      differenceCents: differenceCashCents,
      movements: movements,
      sales: sales,
      numberingResetAt: numberingResetAt,
    );
  }
}

/// Movimento remoto.
class PosCashMovementDto {
  const PosCashMovementDto({
    required this.id,
    required this.sessionId,
    required this.type,
    required this.amountCents,
    required this.reason,
    required this.operation,
    required this.operatorUserId,
    required this.operatorName,
    required this.createdAt,
    this.authorizedByUserId,
    this.authorizedByName,
  });

  final String id;
  final String sessionId;
  final String type;
  final int amountCents;
  final String reason;
  final String operation;
  final String operatorUserId;
  final String operatorName;
  final String? authorizedByUserId;
  final String? authorizedByName;
  final DateTime createdAt;

  factory PosCashMovementDto.fromJson(Map<String, dynamic> json) {
    return PosCashMovementDto(
      id: json['id']! as String,
      sessionId: json['sessionId']! as String,
      type: json['type']! as String,
      amountCents: json['amountCents']! as int,
      reason: (json['reason'] as String?) ?? '',
      operation: (json['operation'] as String?) ?? 'other',
      operatorUserId: json['operatorUserId']! as String,
      operatorName: json['operatorName']! as String,
      authorizedByUserId: json['authorizedByUserId'] as String?,
      authorizedByName: json['authorizedByName'] as String?,
      createdAt: DateTime.parse(json['createdAt']! as String),
    );
  }

  CashMovement toCashMovement() {
    return CashMovement(
      id: id,
      type: CashMovementType.values.byName(type),
      amountCents: amountCents,
      reason: reason,
      operation: _parseOperation(operation),
      operatorId: operatorUserId,
      operatorName: operatorName,
      authorizedByOperatorId: authorizedByUserId,
      authorizedByOperatorName: authorizedByName,
      createdAt: createdAt,
      shiftId: sessionId,
    );
  }
}

CashOperationType _parseOperation(String raw) {
  if (raw == 'cashReinforcement') {
    return CashOperationType.changeSupply;
  }
  try {
    return CashOperationType.values.byName(raw);
  } on ArgumentError {
    return CashOperationType.other;
  }
}

/// Device auth: abrir / consultar / sangrar / fechar turno no servidor.
class PosCashSessionApi {
  const PosCashSessionApi(this._client);

  final PdvApiClient _client;

  Future<PosCashSessionDto?> getCurrent() async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/cash-sessions/current');
      final Object? data = response.data!['data'];
      if (data == null) return null;
      return PosCashSessionDto.fromJson(data as Map<String, dynamic>);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  Future<PosCashSessionDto> open({
    required String operatorUserId,
    required int openingFloatCents,
  }) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .post<Map<String, dynamic>>(
            '/v1/pos/cash-sessions',
            data: <String, Object>{
              'operatorUserId': operatorUserId,
              'openingFloatCents': openingFloatCents,
            },
          );
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return PosCashSessionDto.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  Future<PosCashMovementDto> addMovement({
    required String sessionId,
    required String type,
    required int amountCents,
    required String operatorUserId,
    String? reason,
    String? authorizedByUserId,
  }) async {
    try {
      final Map<String, Object?> body = <String, Object?>{
        'type': type,
        'amountCents': amountCents,
        'operatorUserId': operatorUserId,
        if (reason != null && reason.isNotEmpty) 'reason': reason,
        if (authorizedByUserId != null)
          'authorizedByUserId': authorizedByUserId,
      };
      final Response<Map<String, dynamic>> response = await _client
          .post<Map<String, dynamic>>(
            '/v1/pos/cash-sessions/$sessionId/movements',
            data: body,
          );
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return PosCashMovementDto.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  Future<PosCashSessionDto> close({
    required String sessionId,
    required CashCloseCounts counts,
  }) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .post<Map<String, dynamic>>(
            '/v1/pos/cash-sessions/$sessionId/close',
            data: counts.toJson(),
          );
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return PosCashSessionDto.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  /// Vendas do turno aberto neste terminal (`GET …/current/sales`).
  ///
  /// Pagina até esgotar (ou até [maxPages]) — o histórico do PDV precisa da
  /// lista completa do turno, não só a primeira página.
  Future<List<SaleRecord>> getCurrentSessionSales({
    int perPage = 100,
    int maxPages = 20,
  }) async {
    try {
      final List<SaleRecord> all = <SaleRecord>[];
      var page = 1;
      while (page <= maxPages) {
        final Response<Map<String, dynamic>> response = await _client
            .get<Map<String, dynamic>>(
              '/v1/pos/cash-sessions/current/sales',
              queryParameters: <String, Object>{
                'page': page,
                'perPage': perPage,
              },
            );
        final List<dynamic> rows =
            (response.data!['data'] as List<dynamic>?) ?? const <dynamic>[];
        for (final dynamic row in rows) {
          all.add(
            sessionSaleToSaleRecord(row as Map<String, dynamic>),
          );
        }
        final Map<String, dynamic>? meta =
            response.data!['meta'] as Map<String, dynamic>?;
        final int totalPages = (meta?['totalPages'] as int?) ?? 1;
        if (page >= totalPages || rows.isEmpty) break;
        page++;
      }
      return all;
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}

/// Mapeia o payload de `SessionSale` HTTP → [SaleRecord] local.
///
/// Recalcula dinheiro líquido a partir dos pagamentos (`methodSystemKey` /
/// nome) — o hydrate e Últimas vendas **substituem** as vendas locais, e
/// sem `cashNetCents` o esperado em gaveta vira só fundo ± sangrias.
SaleRecord sessionSaleToSaleRecord(Map<String, dynamic> json) {
  final String sessionId = (json['sessionId'] as String?) ?? '';
  final int number = (json['number'] as int?) ?? 0;
  final String statusRaw = (json['status'] as String?) ?? 'closed';
  final SaleRecordStatus status =
      statusRaw == 'cancelled'
          ? SaleRecordStatus.cancelled
          : SaleRecordStatus.completed;

  final List<dynamic> products =
      (json['products'] as List<dynamic>?) ?? const <dynamic>[];
  final List<SaleLineSnapshot> lines = <SaleLineSnapshot>[
    for (final dynamic raw in products)
      () {
        final Map<String, dynamic> p = raw as Map<String, dynamic>;
        final int qty = (p['quantity'] as num?)?.round() ?? 1;
        final int unit = (p['unitPriceCents'] as int?) ?? 0;
        final int total =
            (p['totalCents'] as int?) ?? (qty * unit);
        return SaleLineSnapshot(
          productId: (p['id'] as String?) ?? '',
          name: (p['productName'] as String?) ?? '',
          quantity: qty <= 0 ? 1 : qty,
          unitPriceCents: unit,
          lineTotalCents: total,
        );
      }(),
  ];

  final List<dynamic> paymentsRaw =
      (json['payments'] as List<dynamic>?) ?? const <dynamic>[];
  final List<SalePaymentSnapshot> payments = <SalePaymentSnapshot>[
    for (final dynamic raw in paymentsRaw)
      () {
        final Map<String, dynamic> p = raw as Map<String, dynamic>;
        final String methodLabel = (p['method'] as String?) ?? '';
        final String? systemKey = p['methodSystemKey'] as String?;
        return SalePaymentSnapshot(
          methodId:
              (p['methodId'] as String?) ??
              (p['id'] as String?) ??
              '',
          methodLabel: methodLabel,
          amountCents: (p['amountCents'] as int?) ?? 0,
          systemKey: systemKey ?? _inferCashSystemKey(methodLabel),
        );
      }(),
  ];

  final int totalCents =
      (json['amountCents'] as int?) ??
      payments.fold<int>(0, (int a, SalePaymentSnapshot p) => a + p.amountCents);
  final DateTime createdAt =
      DateTime.tryParse((json['startedAt'] as String?) ?? '') ??
      DateTime.now();

  final int cashReceivedCents = payments
      .where((SalePaymentSnapshot p) => p.isCash)
      .fold(0, (int sum, SalePaymentSnapshot p) => sum + p.amountCents);
  final int receivedCents = payments.fold(
    0,
    (int sum, SalePaymentSnapshot p) => sum + p.amountCents,
  );
  final int changeCents =
      receivedCents > totalCents ? receivedCents - totalCents : 0;
  final int cashNetCents =
      cashReceivedCents > 0
          ? (cashReceivedCents - changeCents).clamp(0, cashReceivedCents)
          : 0;

  final String? operatorNameRaw = json['operatorName'] as String?;
  final String? sellerNameRaw = json['sellerName'] as String?;

  return SaleRecord(
    id: json['id']! as String,
    number: number,
    serverSaleId: json['id'] as String?,
    serverNumber: number,
    shiftId: sessionId,
    status: status,
    createdAt: createdAt,
    lines: lines,
    payments: payments,
    customerName: json['customerName'] as String?,
    sellerName:
        sellerNameRaw == null || sellerNameRaw.isEmpty ? null : sellerNameRaw,
    operatorName:
        operatorNameRaw == null || operatorNameRaw.isEmpty
            ? null
            : operatorNameRaw,
    subtotalCents: totalCents,
    totalCents: totalCents,
    cashReceivedCents: cashReceivedCents,
    changeCents: changeCents,
    cashNetCents: cashNetCents,
  );
}

/// Fallback quando a API ainda não manda `methodSystemKey` (payload antigo).
String? _inferCashSystemKey(String methodLabel) {
  final String normalized = methodLabel.trim().toLowerCase();
  if (normalized == 'dinheiro' || normalized == 'cash') {
    return 'pm-dinheiro';
  }
  return null;
}

final Provider<PosCashSessionApi> posCashSessionApiProvider =
    Provider<PosCashSessionApi>(
      (Ref ref) => PosCashSessionApi(ref.watch(pdvApiClientProvider)),
    );
