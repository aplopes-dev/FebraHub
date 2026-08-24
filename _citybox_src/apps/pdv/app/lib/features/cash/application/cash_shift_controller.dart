import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/operators/application/supervisor_authorization.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';

/// Store injetável (testes usam SharedPreferences mock).
final Provider<SharedPreferencesCashShiftStore?> cashShiftStoreProvider =
    Provider<SharedPreferencesCashShiftStore?>((Ref ref) => null);

final NotifierProvider<CashShiftController, CashShift?> cashShiftProvider =
    NotifierProvider<CashShiftController, CashShift?>(CashShiftController.new);

/// Próximo número de venda do turno: `maior número já usado + 1`.
///
/// Função pura e de topo para poder ser testada sem montar um turno inteiro.
/// Vendas antigas sem número (`0`, ver `SaleRecord.number`) não influenciam o
/// máximo — um turno hidratado de uma versão anterior recomeça em 1.
///
/// Com [resetAt], só as vendas **posteriores** à marca entram na conta: é o
/// que faz "Zerar numeração" devolver a contagem para 1 sem reescrever o
/// número das vendas já gravadas, que são registro histórico.
int nextSaleNumber(List<SaleRecord> sales, {DateTime? resetAt}) {
  int highest = 0;
  for (final SaleRecord sale in sales) {
    if (resetAt != null && sale.createdAt.isBefore(resetAt)) continue;
    if (sale.number > highest) highest = sale.number;
  }
  return highest + 1;
}

class CashShiftController extends Notifier<CashShift?> {
  SharedPreferencesCashShiftStore? _store;

  PosCashSessionApi get _api => ref.read(posCashSessionApiProvider);

  @override
  CashShift? build() => null;

  bool get hasOpenShift => state != null && state!.isOpen;

  bool get saleInProgress {
    final bool hasCart = ref.read(counterCartProvider).isNotEmpty;
    final bool hasPayments = ref.read(paymentEntriesProvider).isNotEmpty;
    return hasCart || hasPayments;
  }

  Future<void> hydrate() async {
    SharedPreferencesCashShiftStore? store = ref.read(cashShiftStoreProvider);
    if (store == null) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      store = SharedPreferencesCashShiftStore(prefs);
    }
    _store = store;
    final CashShift? cached = await store.read();

    try {
      final PosCashSessionDto? remote = await _api.getCurrent();
      if (remote == null) {
        state = null;
        await store.clear();
        return;
      }
      final bool sameId = cached != null && cached.id == remote.id;
      state = remote.toCashShift(
        movements: sameId ? cached.movements : const <CashMovement>[],
        sales: sameId ? cached.sales : const <SaleRecord>[],
        numberingResetAt: sameId ? cached.numberingResetAt : null,
      );
      await _persist();
      if (remote.status == 'open') {
        await refreshSessionSales();
      }
    } on PdvApiException {
      // Offline / falha: mantém turno aberto do cache local, se houver.
      if (cached != null && cached.isOpen) {
        state = cached;
      } else {
        state = null;
      }
    }
  }

  /// Substitui as vendas locais pelas do servidor (turno aberto).
  ///
  /// Offline: não altera o estado — o cache local permanece. Online com lista
  /// vazia: zera o histórico fantasma (ex.: cancel em outro terminal).
  Future<void> refreshSessionSales() async {
    final CashShift? current = state;
    if (current == null || !current.isOpen) return;
    try {
      final List<SaleRecord> remote = await _api.getCurrentSessionSales();
      state = current.copyWith(sales: remote);
      await _persist();
    } on PdvApiException {
      // Mantém vendas locais.
    }
  }

  /// Abre o turno **em nome de alguém** no servidor (e espelha no cache).
  ///
  /// [operator] é obrigatório: turno sem dono produz venda, sangria e
  /// cancelamento que ninguém consegue atribuir depois.
  ///
  /// Em falha de API **não** inventa turno local — o operador precisa da
  /// sessão no servidor para vender (`CreatePosSale` exige caixa aberto).
  Future<void> openShift({
    required int openingFloatCents,
    required PosOperator operator,
  }) async {
    if (openingFloatCents < 0) {
      throw ArgumentError.value(openingFloatCents, 'openingFloatCents');
    }
    if (hasOpenShift) {
      throw StateError('Já existe um turno aberto.');
    }
    final PosCashSessionDto remote = await _api.open(
      operatorUserId: operator.id,
      openingFloatCents: openingFloatCents,
    );
    // Nome do operador logado prevalece sobre o snapshot do servidor.
    state = CashShift(
      id: remote.id,
      status: CashShiftStatus.open,
      openedAt: remote.openedAt,
      openingFloatCents: remote.openingFloatCents,
      openedByOperatorId: operator.id,
      openedByOperatorName: operator.name,
      movements: const <CashMovement>[],
      sales: const <SaleRecord>[],
    );
    await _persist();
  }

  Future<void> closeShift({required CashCloseCounts counts}) async {
    if (counts.countedCashCents < 0 ||
        counts.countedCreditCents < 0 ||
        counts.countedDebitCents < 0 ||
        counts.countedVoucherCents < 0 ||
        counts.countedOtherCents < 0) {
      throw ArgumentError('Contagens não podem ser negativas.');
    }
    final CashShift? current = state;
    if (current == null || !current.isOpen) {
      throw StateError('Não há turno aberto para fechar.');
    }
    if (saleInProgress) {
      throw StateError(
        'Conclua ou cancele a venda em andamento antes de fechar o caixa.',
      );
    }
    await _api.close(sessionId: current.id, counts: counts);
    state = null;
    await _store?.clear();
  }

  Future<CashMovement> addWithdrawal({
    required int amountCents,
    required String reason,
    CashOperationType operation = CashOperationType.cashWithdrawal,
    SupervisorAuthorization? authorization,
  }) {
    return _addMovement(
      type: CashMovementType.withdrawal,
      amountCents: amountCents,
      reason: reason,
      operation: operation,
      authorization: authorization,
    );
  }

  Future<CashMovement> addReinforcement({
    required int amountCents,
    required String reason,
    CashOperationType operation = CashOperationType.changeSupply,
  }) {
    return _addMovement(
      type: CashMovementType.reinforcement,
      amountCents: amountCents,
      reason: reason,
      operation: operation,
    );
  }

  Future<CashMovement> _addMovement({
    required CashMovementType type,
    required int amountCents,
    required String reason,
    CashOperationType operation = CashOperationType.other,
    SupervisorAuthorization? authorization,
  }) async {
    final String trimmed = reason.trim();
    if (amountCents <= 0) {
      throw ArgumentError.value(amountCents, 'amountCents');
    }
    if (trimmed.isEmpty) {
      throw ArgumentError('Motivo obrigatório.');
    }
    final CashShift? current = state;
    if (current == null || !current.isOpen) {
      throw StateError('Turno aberto obrigatório.');
    }
    final String? operatorUserId = current.openedByOperatorId;
    if (operatorUserId == null || operatorUserId.isEmpty) {
      throw StateError('Turno sem operador — reabra o caixa.');
    }
    final PosCashMovementDto remote = await _api.addMovement(
      sessionId: current.id,
      type: type.name,
      amountCents: amountCents,
      reason: trimmed,
      operatorUserId: operatorUserId,
      authorizedByUserId: authorization?.operatorId,
    );
    // Preferimos o retorno da API (id/carimbos), mas preservamos a operação
    // escolhida na UI quando o servidor defaulta `cashReinforcement`.
    final CashMovement fromApi = remote.toCashMovement();
    final CashMovement movement = CashMovement(
      id: fromApi.id,
      type: fromApi.type,
      amountCents: fromApi.amountCents,
      reason: fromApi.reason.isEmpty ? trimmed : fromApi.reason,
      operation: operation,
      operatorId: current.openedByOperatorId ?? fromApi.operatorId ?? operatorUserId,
      operatorName:
          current.openedByOperatorName ?? fromApi.operatorName,
      authorizedByOperatorId:
          fromApi.authorizedByOperatorId ?? authorization?.operatorId,
      authorizedByOperatorName:
          fromApi.authorizedByOperatorName ?? authorization?.operatorName,
      createdAt: fromApi.createdAt,
      shiftId: current.id,
    );
    state = current.copyWith(
      movements: <CashMovement>[...current.movements, movement],
    );
    await _persist();
    return movement;
  }

  /// Grava a venda no turno aberto (espelho local após checkout online).
  Future<void> recordSale(SaleRecord sale) async {
    final CashShift? current = state;
    if (current == null || !current.isOpen) {
      throw StateError('Turno aberto obrigatório para registrar venda.');
    }
    // Preferência: operador que fechou a venda (completeSale). Fallback: quem
    // abriu o turno — cobre chamadas de teste / espelho sem operador preenchido.
    final SaleRecord numbered = sale.copyWith(
      number: nextSaleNumber(current.sales, resetAt: current.numberingResetAt),
      operatorId: sale.operatorId ?? current.openedByOperatorId,
      operatorName: sale.operatorName ?? current.openedByOperatorName,
    );
    state = current.copyWith(sales: <SaleRecord>[...current.sales, numbered]);
    await _persist();
  }

  /// Zera a numeração: a próxima venda do turno sai como 1.
  Future<void> resetSaleNumbering() async {
    final CashShift? current = state;
    if (current == null || !current.isOpen) {
      throw StateError('Turno aberto obrigatório para zerar a numeração.');
    }
    state = current.copyWith(numberingResetAt: DateTime.now());
    await _persist();
  }

  Future<void> cancelSale(
    String saleId, {
    SupervisorAuthorization? authorization,
  }) async {
    final CashShift? current = state;
    if (current == null || !current.isOpen) {
      throw StateError('Turno aberto obrigatório.');
    }
    final List<SaleRecord> next = <SaleRecord>[
      for (final SaleRecord s in current.sales)
        if (s.id == saleId && s.status == SaleRecordStatus.completed)
          s.copyWith(
            status: SaleRecordStatus.cancelled,
            cancelledAt: DateTime.now(),
            cancellationAuthorizedByOperatorId: authorization?.operatorId,
            cancellationAuthorizedByOperatorName: authorization?.operatorName,
          )
        else
          s,
    ];
    state = current.copyWith(sales: next);
    await _persist();
  }

  Future<void> _persist() async {
    final CashShift? current = state;
    final SharedPreferencesCashShiftStore? store = _store;
    if (store == null) {
      return;
    }
    if (current == null) {
      await store.clear();
      return;
    }
    await store.write(current);
  }
}
