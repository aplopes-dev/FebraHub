import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';

/// Test double de `/v1/pos/cash-sessions` (device).
class FakePosCashSessionApi extends PosCashSessionApi {
  FakePosCashSessionApi({this.throwOffline = false, this.throwMessage})
    : super(PdvApiClient(baseUrl: 'http://test.invalid/api'));

  final bool throwOffline;
  final String? throwMessage;

  PosCashSessionDto? _current;
  List<SaleRecord> _sessionSales = const <SaleRecord>[];
  int _seq = 0;

  int openCalls = 0;
  int getCurrentCalls = 0;
  int getCurrentSessionSalesCalls = 0;
  int addMovementCalls = 0;
  int closeCalls = 0;

  void seedOpen(PosCashSessionDto session) {
    _current = session;
  }

  void seedSessionSales(List<SaleRecord> sales) {
    _sessionSales = List<SaleRecord>.from(sales);
  }

  void _maybeThrow() {
    if (throwOffline) {
      throw const PdvApiException(
        'Sem conexão com o servidor da loja.',
        isOffline: true,
      );
    }
    if (throwMessage != null) {
      throw PdvApiException(throwMessage!, statusCode: 422);
    }
  }

  String _nextId(String prefix) {
    _seq++;
    return '$prefix-$_seq';
  }

  @override
  Future<PosCashSessionDto?> getCurrent() async {
    getCurrentCalls++;
    _maybeThrow();
    final PosCashSessionDto? session = _current;
    if (session == null || session.status != 'open') return null;
    return session;
  }

  @override
  Future<List<SaleRecord>> getCurrentSessionSales({
    int perPage = 100,
    int maxPages = 20,
  }) async {
    getCurrentSessionSalesCalls++;
    _maybeThrow();
    return List<SaleRecord>.from(_sessionSales);
  }

  @override
  Future<PosCashSessionDto> open({
    required String operatorUserId,
    required int openingFloatCents,
  }) async {
    openCalls++;
    _maybeThrow();
    if (_current != null && _current!.status == 'open') {
      throw const PdvApiException(
        'Já existe um turno aberto neste terminal.',
        statusCode: 409,
      );
    }
    final PosCashSessionDto session = PosCashSessionDto(
      id: _nextId('session'),
      status: 'open',
      openedAt: DateTime.now(),
      openingFloatCents: openingFloatCents,
      openedByUserId: operatorUserId,
      openedByName: 'Operador',
    );
    _current = session;
    _sessionSales = const <SaleRecord>[];
    return session;
  }

  @override
  Future<PosCashMovementDto> addMovement({
    required String sessionId,
    required String type,
    required int amountCents,
    required String operatorUserId,
    String? reason,
    String? authorizedByUserId,
  }) async {
    addMovementCalls++;
    _maybeThrow();
    final PosCashSessionDto? session = _current;
    if (session == null ||
        session.id != sessionId ||
        session.status != 'open') {
      throw const PdvApiException('Turno não encontrado.', statusCode: 404);
    }
    final String operation =
        type == 'withdrawal' ? 'cashWithdrawal' : 'cashReinforcement';
    return PosCashMovementDto(
      id: _nextId('mov'),
      sessionId: sessionId,
      type: type,
      amountCents: amountCents,
      reason: reason ?? '',
      operation: operation,
      operatorUserId: operatorUserId,
      operatorName: session.openedByName,
      authorizedByUserId: authorizedByUserId,
      authorizedByName: authorizedByUserId != null ? 'Supervisor' : null,
      createdAt: DateTime.now(),
    );
  }

  @override
  Future<PosCashSessionDto> close({
    required String sessionId,
    required CashCloseCounts counts,
  }) async {
    closeCalls++;
    _maybeThrow();
    final PosCashSessionDto? session = _current;
    if (session == null ||
        session.id != sessionId ||
        session.status != 'open') {
      throw const PdvApiException('Turno não encontrado.', statusCode: 404);
    }
    final PosCashSessionDto closed = PosCashSessionDto(
      id: session.id,
      status: 'closed',
      openedAt: session.openedAt,
      closedAt: DateTime.now(),
      openingFloatCents: session.openingFloatCents,
      openedByUserId: session.openedByUserId,
      openedByName: session.openedByName,
      countedCashCents: counts.countedCashCents,
      differenceCashCents: 0,
    );
    _current = closed;
    return closed;
  }
}
