import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';

/// Resposta de `POST /v1/pos/sales`.
class PosSaleResult {
  const PosSaleResult({
    required this.id,
    required this.number,
    required this.totalCents,
    required this.customerName,
    this.consumerDocument,
    this.customerId,
    required this.createdAt,
  });

  final String id;
  final int number;
  final int totalCents;
  final String customerName;
  final String? consumerDocument;
  final String? customerId;
  final DateTime createdAt;

  factory PosSaleResult.fromJson(Map<String, dynamic> json) {
    return PosSaleResult(
      id: json['id']! as String,
      number: json['number']! as int,
      totalCents: json['totalCents']! as int,
      customerName: json['customerName']! as String,
      consumerDocument: json['consumerDocument'] as String?,
      customerId: json['customerId'] as String?,
      createdAt: DateTime.parse(json['createdAt']! as String),
    );
  }
}

/// Checkout e cancelamento do terminal (`POST /v1/pos/sales` + `…/cancel`).
class PosSalesApi {
  const PosSalesApi(this._client);

  final PdvApiClient _client;

  Future<PosSaleResult> create(Map<String, dynamic> body) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .post<Map<String, dynamic>>('/v1/pos/sales', data: body);
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return PosSaleResult.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  /// Cancela a venda no ERP (`POST /v1/pos/sales/:id/cancel`).
  Future<PosSaleResult> cancel({
    required String saleId,
    required String operatorId,
    String? authorizedByUserId,
    String? reason,
  }) async {
    try {
      final Response<Map<String, dynamic>> response = await _client
          .post<Map<String, dynamic>>(
            '/v1/pos/sales/$saleId/cancel',
            data: <String, dynamic>{
              'operatorId': operatorId,
              if (authorizedByUserId != null)
                'authorizedByUserId': authorizedByUserId,
              if (reason != null && reason.trim().isNotEmpty)
                'reason': reason.trim(),
            },
          );
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      return PosSaleResult.fromJson(data);
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }
}
