import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';

/// Pagamentos já lançados na venda em curso.
///
/// Lista, e não um valor só: a venda pode ser paga em partes — metade no
/// dinheiro, metade no cartão.
final NotifierProvider<PaymentEntriesController, List<PaymentEntry>>
paymentEntriesProvider =
    NotifierProvider<PaymentEntriesController, List<PaymentEntry>>(
      PaymentEntriesController.new,
    );

class PaymentEntriesController extends Notifier<List<PaymentEntry>> {
  @override
  List<PaymentEntry> build() => const <PaymentEntry>[];

  /// Lança um pagamento. Sempre uma entrada nova — duas parcelas de R$ 50 no
  /// dinheiro são duas linhas, não uma de R$ 100: o operador precisa poder
  /// desfazer só a última, e uma soma silenciosa tiraria isso dele.
  void add(PaymentEntry entry) {
    state = <PaymentEntry>[...state, entry];
  }

  void removeAt(int index) {
    if (index < 0 || index >= state.length) {
      return;
    }
    state = <PaymentEntry>[
      for (int i = 0; i < state.length; i++)
        if (i != index) state[i],
    ];
  }

  void clear() => state = const <PaymentEntry>[];
}
