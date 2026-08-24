import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/payment/application/payment_methods_controller.dart';
import 'package:citybox_pdv/features/payment/data/fixture_payment_methods_source.dart';
import 'package:citybox_pdv/features/payment/data/payment_catalog.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// Catálogo fixture já hidratado — para testes de UI de Pagamento.
class FixturePaymentMethodsController extends PaymentMethodsController {
  FixturePaymentMethodsController([
    this._methods = fixturePaymentMethods,
  ]);

  final List<PaymentMethod> _methods;

  @override
  PaymentMethodsState build() {
    return PaymentMethodsState(methods: _methods, hydrated: true);
  }
}

List<Override> fixturePaymentMethodsOverrides() => <Override>[
  paymentMethodsSourceProvider.overrideWithValue(
    const FixturePaymentMethodsSource(),
  ),
  paymentMethodsProvider.overrideWith(FixturePaymentMethodsController.new),
];
