import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/payment/data/pos_sales_api.dart';

/// Test double de `POST /v1/pos/sales` e `…/cancel`.
class FakePosSalesApi extends PosSalesApi {
  FakePosSalesApi({
    this.throwOffline = false,
    this.throwMessage,
    this.cancelThrowMessage,
    this.cancelStatusCode = 409,
    PosSaleResult? result,
  }) : result =
           result ??
           PosSaleResult(
             id: 'sale-remote-1',
             number: 1001,
             totalCents: 8490,
             customerName: 'Consumidor Final',
             createdAt: DateTime.utc(2026, 8, 12, 15),
           ),
       super(PdvApiClient(baseUrl: 'http://test.invalid/api'));

  final bool throwOffline;
  final String? throwMessage;
  final String? cancelThrowMessage;
  final int cancelStatusCode;
  final PosSaleResult result;
  int createCalls = 0;
  int cancelCalls = 0;
  Map<String, dynamic>? lastBody;
  String? lastCancelSaleId;
  String? lastCancelOperatorId;
  String? lastCancelAuthorizedByUserId;

  @override
  Future<PosSaleResult> create(Map<String, dynamic> body) async {
    createCalls++;
    lastBody = body;
    if (throwOffline) {
      throw const PdvApiException(
        'Sem conexão com o servidor da loja.',
        isOffline: true,
      );
    }
    if (throwMessage != null) {
      throw PdvApiException(throwMessage!, statusCode: 422);
    }
    return result;
  }

  @override
  Future<PosSaleResult> cancel({
    required String saleId,
    required String operatorId,
    String? authorizedByUserId,
    String? reason,
  }) async {
    cancelCalls++;
    lastCancelSaleId = saleId;
    lastCancelOperatorId = operatorId;
    lastCancelAuthorizedByUserId = authorizedByUserId;
    if (throwOffline) {
      throw const PdvApiException(
        'Sem conexão com o servidor da loja.',
        isOffline: true,
      );
    }
    if (cancelThrowMessage != null) {
      throw PdvApiException(
        cancelThrowMessage!,
        statusCode: cancelStatusCode,
      );
    }
    return PosSaleResult(
      id: saleId,
      number: result.number,
      totalCents: result.totalCents,
      customerName: result.customerName,
      consumerDocument: result.consumerDocument,
      customerId: result.customerId,
      createdAt: result.createdAt,
    );
  }
}
