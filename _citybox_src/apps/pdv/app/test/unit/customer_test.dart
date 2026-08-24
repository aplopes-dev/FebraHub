import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/customer/application/customer_catalog_controller.dart';
import 'package:citybox_pdv/features/customer/data/customer_catalog.dart';
import 'package:citybox_pdv/features/customer/data/fixture_customer_catalog_source.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_person_type.dart';

const Customer _maria = Customer(
  id: 'cust_01',
  name: 'Maria Aparecida Santos',
  document: '52998224725',
);

ProviderContainer _container() {
  final ProviderContainer container = ProviderContainer(
    overrides: <Override>[
      customerCatalogSourceProvider.overrideWithValue(
        FixtureCustomerCatalogSource(),
      ),
    ],
  );
  return container;
}

void main() {
  group('Customer.matches', () {
    test('busca vazia casa com todo mundo', () {
      expect(_maria.matches(''), isTrue);
      expect(_maria.matches('   '), isTrue);
    });

    test('acha por parte do nome, ignorando caixa e acento', () {
      expect(_maria.matches('aparecida'), isTrue);
      expect(_maria.matches('APARECIDA'), isTrue);
      expect(_maria.matches('maria'), isTrue);
    });

    test('acha pelo documento', () {
      expect(_maria.matches('52998'), isTrue);
    });

    test('não casa com quem não é', () {
      expect(_maria.matches('atlantico'), isFalse);
    });
  });

  group('Customer.fromJson / toCreateBody', () {
    test('mapeia listagem POS', () {
      final Customer customer = Customer.fromJson(<String, dynamic>{
        'id': 'uuid-1',
        'personType': 'PF',
        'name': 'Ana',
        'document': '52998224725',
        'email': 'ana@x.com',
        'phone': null,
        'mobilePhone': '73999',
        'stage': 'active',
        'categoryId': null,
        'createdAt': '2026-08-12T00:00:00.000Z',
      });
      expect(customer.personType, CustomerPersonType.individual);
      expect(customer.document, '52998224725');
      expect(customer.toCreateBody()['personType'], 'PF');
    });
  });

  group('catálogo de clientes', () {
    test('seed não repete id', () {
      final Set<String> ids = seedCustomers.map((Customer c) => c.id).toSet();
      expect(ids, hasLength(seedCustomers.length));
    });

    test('hydrate carrega fixture e upsert insere novo', () async {
      final ProviderContainer container = _container();
      addTearDown(container.dispose);

      await container.read(customerCatalogProvider.notifier).hydrate();
      expect(
        container.read(customerCatalogProvider).items,
        hasLength(seedCustomers.length),
      );

      final List<String> names =
          container
              .read(customerCatalogProvider)
              .items
              .map((Customer c) => c.name)
              .toList();
      final List<String> sorted = List<String>.of(names)..sort(
        (String a, String b) =>
            a.toLowerCase().compareTo(b.toLowerCase()),
      );
      // Ordem alfabética (fixture pode vir fora de ordem).
      expect(names, sorted);

      final Customer novo = const Customer(
        id: 'cust_novo',
        name: 'Cliente Novo',
        personType: CustomerPersonType.individual,
      );

      container.read(customerCatalogProvider.notifier).upsert(novo);

      expect(
        container
            .read(customerCatalogProvider)
            .items
            .any((Customer c) => c.id == 'cust_novo'),
        isTrue,
      );
      expect(
        container.read(customerCatalogProvider).items,
        hasLength(seedCustomers.length + 1),
      );
    });

    test('upsert substitui cliente existente', () async {
      final ProviderContainer container = _container();
      addTearDown(container.dispose);

      await container.read(customerCatalogProvider.notifier).hydrate();

      final Customer atualizado = _maria.copyWith(name: 'Maria Atualizada');
      container.read(customerCatalogProvider.notifier).upsert(atualizado);

      final Customer found = container
          .read(customerCatalogProvider)
          .items
          .firstWhere((Customer c) => c.id == _maria.id);

      expect(found.name, 'Maria Atualizada');
      expect(
        container.read(customerCatalogProvider).items,
        hasLength(seedCustomers.length),
      );
    });
  });
}
