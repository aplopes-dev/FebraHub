import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/payment/application/payment_draft_controller.dart';
import 'package:citybox_pdv/features/payment/data/payment_catalog.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

final PaymentMethod _cash = fixturePaymentMethods[0];

final PaymentMethod _credit = fixturePaymentMethods[1];

ProviderContainer _container() {
  final ProviderContainer container = ProviderContainer();
  addTearDown(container.dispose);
  return container;
}

void main() {
  test('começa em dinheiro, sem valor digitado', () {
    final ProviderContainer container = _container();

    final PaymentDraft draft = container.read(paymentDraftProvider);
    expect(draft.method.id, _cash.id);
    expect(draft.amountCents, 0);
    expect(draft.canReceive, isFalse);
  });

  test('dígitos entram pela direita, em centavos', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.pushDigit('8');
    expect(container.read(paymentDraftProvider).amountCents, 8);
    controller.pushDigit('4');
    expect(container.read(paymentDraftProvider).amountCents, 84);
    controller.pushDigit('9');
    expect(container.read(paymentDraftProvider).amountCents, 849);
    controller.pushDigit('0');
    expect(container.read(paymentDraftProvider).amountCents, 8490);
  });

  test('zero à esquerda não entra — "0" seguido de "5" é 5 centavos', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.pushDigit('0');
    expect(container.read(paymentDraftProvider).amountCents, 0);
    controller.pushDigit('5');
    expect(container.read(paymentDraftProvider).amountCents, 5);
  });

  test('backspace apaga o último dígito', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.setAmountCents(8490);
    controller.backspace();

    expect(container.read(paymentDraftProvider).amountCents, 849);
  });

  test('backspace com o campo vazio não quebra', () {
    final ProviderContainer container = _container();

    container.read(paymentDraftProvider.notifier).backspace();

    expect(container.read(paymentDraftProvider).amountCents, 0);
  });

  test('C zera o valor mas mantém a forma e a bandeira', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.selectMethod(_credit);
    controller.selectBrand('Visa');
    controller.setAmountCents(5000);
    controller.clearAmount();

    final PaymentDraft draft = container.read(paymentDraftProvider);
    expect(draft.amountCents, 0);
    expect(draft.method.id, _credit.id);
    expect(draft.brand, 'Visa');
  });

  test('os atalhos de cédula somam ao que já está digitado', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.setAmountCents(490);
    controller.addCents(5000);
    controller.addCents(2000);

    expect(container.read(paymentDraftProvider).amountCents, 7490);
  });

  test('trocar de forma zera bandeira, parcelas e valor', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.selectMethod(_credit);
    controller.selectBrand('Visa');
    controller.setInstallments(6);
    controller.setAmountCents(10000);

    controller.selectMethod(_cash);

    final PaymentDraft draft = container.read(paymentDraftProvider);
    expect(draft.method.id, _cash.id);
    expect(draft.brand, isNull);
    expect(draft.installments, 1);
    expect(draft.amountCents, 0);
  });

  test('forma com bandeira pede bandeira antes do valor', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.selectMethod(_credit);
    expect(container.read(paymentDraftProvider).needsBrand, isTrue);

    controller.selectBrand('MasterCard');
    expect(container.read(paymentDraftProvider).needsBrand, isFalse);
  });

  test('sem bandeira escolhida não dá para receber, mesmo com valor', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.selectMethod(_credit);
    controller.setAmountCents(5000);

    expect(container.read(paymentDraftProvider).canReceive, isFalse);

    controller.selectBrand('Visa');
    expect(container.read(paymentDraftProvider).canReceive, isTrue);
  });

  test('valor zero não dá para receber', () {
    final ProviderContainer container = _container();

    expect(container.read(paymentDraftProvider).canReceive, isFalse);
  });

  test('reset limpa o valor e mantém a forma escolhida', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    controller.selectMethod(_credit);
    controller.selectBrand('Visa');
    controller.setAmountCents(5000);
    controller.reset();

    final PaymentDraft draft = container.read(paymentDraftProvider);
    expect(draft.method.id, _credit.id);
    expect(draft.amountCents, 0);
    // Bandeira volta a faltar — o próximo pagamento no crédito pode ser em
    // outra bandeira, e herdá-la silenciosamente lançaria errado.
    expect(draft.brand, isNull);
  });

  test('syncMethodWithCatalog troca fixture cash pelo UUID do ERP', () {
    final ProviderContainer container = _container();
    final PaymentDraftController controller = container.read(
      paymentDraftProvider.notifier,
    );

    // Simula meio legado (id não está no catálogo do ERP).
    controller.selectMethod(
      const PaymentMethod(id: 'cash', label: 'Dinheiro', systemKey: 'pm-dinheiro'),
    );
    controller.setAmountCents(1500);

    const PaymentMethod erpCash = PaymentMethod(
      id: '6dac1cf7-90f8-48b3-8360-18c399645be5',
      label: 'Dinheiro',
      systemKey: 'pm-dinheiro',
    );
    controller.syncMethodWithCatalog(<PaymentMethod>[erpCash]);

    final PaymentDraft draft = container.read(paymentDraftProvider);
    expect(draft.method.id, erpCash.id);
    expect(draft.amountCents, 1500);
  });
}
