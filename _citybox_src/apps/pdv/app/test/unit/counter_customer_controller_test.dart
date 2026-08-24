import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';

const Customer _maria = Customer(id: 'cust_maria', name: 'Maria');

void main() {
  test('começa com o consumidor final padrão', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    expect(container.read(counterCustomerProvider), isNull);
    expect(
      CounterCustomerController.labelOf(
        container.read(counterCustomerProvider),
      ),
      CounterCustomerController.defaultCustomerLabel,
    );
  });

  test('setCustomer troca o cliente exibido', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    container.read(counterCustomerProvider.notifier).setCustomer(_maria);

    expect(container.read(counterCustomerProvider), _maria);
    expect(
      CounterCustomerController.labelOf(
        container.read(counterCustomerProvider),
      ),
      'Maria',
    );
  });

  test('reset devolve ao consumidor final padrão', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterCustomerController controller = container.read(
      counterCustomerProvider.notifier,
    );

    controller.setCustomer(_maria);
    controller.reset();

    expect(container.read(counterCustomerProvider), isNull);
    expect(
      CounterCustomerController.labelOf(
        container.read(counterCustomerProvider),
      ),
      CounterCustomerController.defaultCustomerLabel,
    );
  });

  group('resolveCounterCustomerFromDelivery', () {
    test('usa o cadastro quando o id bate', () {
      final Customer? resolved = resolveCounterCustomerFromDelivery(
        customerId: 'cust_maria',
        customerName: 'Outro rótulo',
        catalog: const <Customer>[_maria],
      );
      expect(resolved, same(_maria));
    });

    test('monta cliente mínimo com id do CRM', () {
      final Customer? resolved = resolveCounterCustomerFromDelivery(
        customerId: 'cust_x',
        customerName: 'Bruno',
      );
      expect(resolved?.id, 'cust_x');
      expect(resolved?.name, 'Bruno');
    });

    test('nome avulso sem CRM usa id vazio', () {
      final Customer? resolved = resolveCounterCustomerFromDelivery(
        customerName: 'Avulso',
      );
      expect(resolved?.id, isEmpty);
      expect(resolved?.name, 'Avulso');
    });

    test('sem id nem nome devolve null', () {
      expect(resolveCounterCustomerFromDelivery(), isNull);
    });
  });
}
