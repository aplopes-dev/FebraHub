import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/payment/application/payment_methods_controller.dart';
import 'package:citybox_pdv/features/payment/data/payment_catalog.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// O pagamento que o operador está compondo — antes de apertar "Receber".
///
/// Estado próprio, e não o `PaymentEntry` já pronto: enquanto compõe, a
/// bandeira pode faltar e o valor pode estar pela metade. Só vira
/// `PaymentEntry` no instante do "Receber", quando tudo já é válido.
class PaymentDraft {
  const PaymentDraft({
    required this.method,
    this.brand,
    this.installments = 1,
    this.amountDigits = '',
  });

  final PaymentMethod method;
  final String? brand;
  final int installments;

  /// O valor como o operador digitou, **em centavos e só dígitos**
  /// (`"8490"` = R$ 84,90). Guardar o texto cru, e não um `double`, é o que
  /// faz o teclado numérico funcionar como o de uma maquininha: cada tecla
  /// empurra um dígito pela direita, sem o operador precisar mirar a vírgula.
  final String amountDigits;

  /// Valor em centavos (inteiro).
  int get amountCents => int.tryParse(amountDigits) ?? 0;

  /// A forma pede bandeira e nenhuma foi escolhida ainda — enquanto isto for
  /// verdade a tela mostra o seletor de bandeiras, não o teclado.
  bool get needsBrand => method.requiresBrand && brand == null;

  /// Dá para lançar: a bandeira (quando exigida) já está escolhida e o valor
  /// é maior que zero.
  bool get canReceive => !needsBrand && amountCents > 0;

  PaymentDraft copyWith({
    PaymentMethod? method,
    String? brand,
    int? installments,
    String? amountDigits,
  }) {
    return PaymentDraft(
      method: method ?? this.method,
      brand: brand ?? this.brand,
      installments: installments ?? this.installments,
      amountDigits: amountDigits ?? this.amountDigits,
    );
  }
}

final NotifierProvider<PaymentDraftController, PaymentDraft>
paymentDraftProvider = NotifierProvider<PaymentDraftController, PaymentDraft>(
  PaymentDraftController.new,
);

class PaymentDraftController extends Notifier<PaymentDraft> {
  /// Teto de dígitos do valor — R$ 9.999.999,99. Sem ele, segurar uma tecla
  /// numérica cresce a string até estourar o `int.tryParse`.
  static const int _maxDigits = 9;

  /// Resolve o meio inicial: catálogo do ERP (preferindo dinheiro) ou fixture
  /// só enquanto a lista ainda não hidratou (testes / boot).
  PaymentMethod resolveDefaultMethod(List<PaymentMethod> methods) {
    if (methods.isEmpty) {
      return fixturePaymentMethods.first;
    }
    for (final PaymentMethod method in methods) {
      if (method.systemKey == 'pm-dinheiro' || method.isCash) {
        return method;
      }
    }
    return methods.first;
  }

  /// Troca um meio “fantasma” (fixture `cash`/`pix`, …) pelo UUID real do ERP
  /// quando o catálogo chega — sem isso o POST `/v1/pos/sales` falha no
  /// `IsUUID` do `methodId` e a UI só mostrava erro genérico.
  void syncMethodWithCatalog(List<PaymentMethod> methods) {
    if (methods.isEmpty) {
      return;
    }
    final bool known = methods.any(
      (PaymentMethod m) => m.id == state.method.id,
    );
    if (known) {
      return;
    }
    final PaymentMethod next = resolveDefaultMethod(methods);
    state = PaymentDraft(
      method: next,
      amountDigits: state.amountDigits,
      installments: 1,
    );
  }

  @override
  PaymentDraft build() {
    ref.listen<PaymentMethodsState>(paymentMethodsProvider, (
      PaymentMethodsState? previous,
      PaymentMethodsState next,
    ) {
      syncMethodWithCatalog(next.methods);
    });
    final List<PaymentMethod> methods =
        ref.read(paymentMethodsProvider).methods;
    return PaymentDraft(method: resolveDefaultMethod(methods));
  }

  void selectMethod(PaymentMethod method) {
    state = PaymentDraft(method: method);
  }

  void selectBrand(String brand) {
    state = state.copyWith(brand: brand);
  }

  void setInstallments(int installments) {
    state = state.copyWith(installments: installments);
  }

  void pushDigit(String digit) {
    if (state.amountDigits.length >= _maxDigits) {
      return;
    }
    final String next =
        state.amountDigits.isEmpty && digit == '0'
            ? ''
            : '${state.amountDigits}$digit';
    state = state.copyWith(amountDigits: next);
  }

  void backspace() {
    final String digits = state.amountDigits;
    if (digits.isEmpty) {
      return;
    }
    state = state.copyWith(
      amountDigits: digits.substring(0, digits.length - 1),
    );
  }

  void clearAmount() {
    state = state.copyWith(amountDigits: '');
  }

  void addCents(int centsToAdd) {
    setAmountCents(state.amountCents + centsToAdd);
  }

  void setAmountCents(int cents) {
    if (cents <= 0) {
      state = state.copyWith(amountDigits: '');
      return;
    }
    final String digits = '$cents';
    state = state.copyWith(
      amountDigits:
          digits.length > _maxDigits ? digits.substring(0, _maxDigits) : digits,
    );
  }

  void reset() {
    state = PaymentDraft(method: state.method);
  }
}
