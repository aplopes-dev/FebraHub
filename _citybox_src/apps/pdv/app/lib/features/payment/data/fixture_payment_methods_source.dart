import 'package:citybox_pdv/features/payment/data/http_payment_methods_source.dart';
import 'package:citybox_pdv/features/payment/data/payment_catalog.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// Fonte fixture — **só testes**. Produção usa [HttpPaymentMethodsSource].
class FixturePaymentMethodsSource implements PaymentMethodsSource {
  const FixturePaymentMethodsSource([
    this.methods = fixturePaymentMethods,
  ]);

  final List<PaymentMethod> methods;

  @override
  Future<List<PaymentMethod>> load() async => methods;
}
