import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/credit/data/shared_preferences_credit_store.dart';
import 'package:citybox_pdv/features/credit/domain/credit_models.dart';

final Provider<SharedPreferencesCreditStore?> creditStoreProvider =
    Provider<SharedPreferencesCreditStore?>((Ref ref) => null);

final NotifierProvider<CreditController, CreditState> creditProvider =
    NotifierProvider<CreditController, CreditState>(CreditController.new);

class CreditController extends Notifier<CreditState> {
  SharedPreferencesCreditStore? _store;

  @override
  CreditState build() => const CreditState();

  Future<void> hydrate() async {
    SharedPreferencesCreditStore? store = ref.read(creditStoreProvider);
    if (store == null) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      store = SharedPreferencesCreditStore(prefs);
    }
    _store = store;
    state = await store.read();
    await _persist();
  }

  Future<void> receivePayment({
    required String customerId,
    required int amountCents,
    required bool cashIntoDrawer,
    String? shiftId,
  }) async {
    if (amountCents <= 0) {
      throw ArgumentError('Valor deve ser maior que zero');
    }
    final CustomerCreditAccount? account = state.accountFor(customerId);
    final int balance = account?.balanceCents ?? 0;
    if (amountCents > balance) {
      throw ArgumentError('Valor acima do saldo');
    }

    final CustomerCreditAccount nextAccount = CustomerCreditAccount(
      customerId: customerId,
      balanceCents: balance - amountCents,
      updatedAt: DateTime.now(),
    );

    final CreditLedgerEntry entry = CreditLedgerEntry(
      id: DateTime.now().microsecondsSinceEpoch.toRadixString(16),
      customerId: customerId,
      type: CreditEntryType.payment,
      amountCents: amountCents,
      createdAt: DateTime.now(),
      shiftId: shiftId,
      note: 'Pagamento de crédito',
    );

    state = CreditState(
      accounts: <CustomerCreditAccount>[
        for (final CustomerCreditAccount a in state.accounts)
          if (a.customerId == customerId) nextAccount else a,
        if (account == null) nextAccount,
      ],
      entries: <CreditLedgerEntry>[entry, ...state.entries],
    );
    await _persist();

    if (cashIntoDrawer) {
      await ref
          .read(cashShiftProvider.notifier)
          .addReinforcement(
            amountCents: amountCents,
            reason: 'Recebimento crédito $customerId',
          );
    }
  }

  Future<void> creditFromRefund({
    required String customerId,
    required int amountCents,
    required String refundId,
    String? shiftId,
  }) async {
    if (amountCents <= 0) {
      throw ArgumentError('Valor inválido');
    }
    final CustomerCreditAccount? account = state.accountFor(customerId);
    final int balance = account?.balanceCents ?? 0;
    final CustomerCreditAccount nextAccount = CustomerCreditAccount(
      customerId: customerId,
      balanceCents: balance + amountCents,
      updatedAt: DateTime.now(),
    );
    final CreditLedgerEntry entry = CreditLedgerEntry(
      id: DateTime.now().microsecondsSinceEpoch.toRadixString(16),
      customerId: customerId,
      type: CreditEntryType.creditFromRefund,
      amountCents: amountCents,
      createdAt: DateTime.now(),
      shiftId: shiftId,
      refundId: refundId,
      note: 'Estorno devolução',
    );
    state = CreditState(
      accounts: <CustomerCreditAccount>[
        for (final CustomerCreditAccount a in state.accounts)
          if (a.customerId == customerId) nextAccount else a,
        if (account == null) nextAccount,
      ],
      entries: <CreditLedgerEntry>[entry, ...state.entries],
    );
    await _persist();
  }

  Future<void> _persist() async {
    final SharedPreferencesCreditStore? store = _store;
    if (store == null) {
      return;
    }
    await store.write(state);
  }
}
