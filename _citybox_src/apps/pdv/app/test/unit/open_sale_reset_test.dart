import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_category_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/counter/application/food_charges_controller.dart';
import 'package:citybox_pdv/features/counter/application/sale_adjustment_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_note_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_seller_controller.dart';
import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';
import 'package:citybox_pdv/features/shared/application/reset_open_sale.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

import '../helpers/fake_device_credential_store.dart';

const CounterProduct _product = CounterProduct(
  id: 'p-1',
  name: 'Café',
  priceCents: 500,
  categoryId: 'cafes',
);

const PaymentMethod _method = PaymentMethod(id: 'cash', label: 'Dinheiro');

const Customer _customer = Customer(id: 'cust-1', name: 'Ana');

const Seller _seller = Seller(id: 's-1', code: '01', name: 'João');

DeviceCredential _org2() {
  return const DeviceCredential(
    token: 'token-org-2',
    terminalId: 'terminal-2',
    terminalName: 'Caixa 2',
    organizationId: 'org-2',
    branchId: 'branch-2',
  );
}

void _fillOpenSale(ProviderContainer container) {
  container.read(counterCartProvider.notifier).addProduct(_product);
  container.read(paymentEntriesProvider.notifier).add(
    const PaymentEntry(method: _method, amountCents: 500),
  );
  container.read(counterCustomerProvider.notifier).setCustomer(_customer);
  container.read(saleSellerProvider.notifier).select(_seller);
  container.read(saleNoteProvider.notifier).setNote('sem açúcar');
  container.read(saleAdjustmentProvider.notifier).setAdjustment(
    const SaleAdjustment(
      kind: SaleAdjustmentKind.discount,
      mode: SaleAdjustmentMode.percent,
      percentBps: 1000,
    ),
  );
  container
      .read(foodChargesProvider.notifier)
      .setServiceFee(enabled: true, percentBps: 1000);
  container.read(counterPendingQtyProvider.notifier).setQty(2);
  container.read(counterBarcodeErrorProvider.notifier).setError('não achou');
  container.read(counterCategoryProvider.notifier).select('cafes');
  container.read(activeAccountIdProvider.notifier).state = 'mesa-3';
}

void _expectSaleCleared(ProviderContainer container) {
  expect(container.read(counterCartProvider), isEmpty);
  expect(container.read(paymentEntriesProvider), isEmpty);
  expect(container.read(counterCustomerProvider), isNull);
  expect(container.read(saleSellerProvider), isNull);
  expect(container.read(saleNoteProvider), isEmpty);
  expect(container.read(saleAdjustmentProvider), isNull);
  expect(container.read(foodChargesProvider).serviceFeeEnabled, isFalse);
  expect(container.read(counterPendingQtyProvider), isNull);
  expect(container.read(counterBarcodeErrorProvider), isNull);
  expect(container.read(counterCategoryProvider), isNull);
  expect(container.read(activeAccountIdProvider), isNull);
}

void main() {
  group('saleIdentityChanged', () {
    test('desativar limpa (previous preenchido, next nulo)', () {
      expect(saleIdentityChanged(pairedFixture, null), isTrue);
    });

    test('primeiro pareamento não limpa', () {
      expect(saleIdentityChanged(null, pairedFixture), isFalse);
    });

    test('mesma identidade não limpa', () {
      expect(saleIdentityChanged(pairedFixture, pairedFixture), isFalse);
    });

    test('troca de organização limpa', () {
      expect(saleIdentityChanged(pairedFixture, _org2()), isTrue);
    });
  });

  group('openSaleResetBindingProvider', () {
    late FakeDeviceCredentialStore store;
    late ProviderContainer container;

    setUp(() {
      store = FakeDeviceCredentialStore();
      container = ProviderContainer(
        overrides: <Override>[
          deviceCredentialStoreProvider.overrideWithValue(store),
        ],
      );
      addTearDown(container.dispose);
      container.read(openSaleResetBindingProvider);
    });

    test('desativar o terminal zera a venda em curso', () async {
      await store.write(pairedFixture);
      await container.read(deviceCredentialProvider.notifier).hydrate();
      _fillOpenSale(container);
      expect(container.read(counterCartProvider), isNotEmpty);

      await container.read(deviceCredentialProvider.notifier).forget();

      _expectSaleCleared(container);
    });

    test('trocar de organização sem passar por nulo também zera', () async {
      await store.write(pairedFixture);
      await container.read(deviceCredentialProvider.notifier).hydrate();
      _fillOpenSale(container);

      await store.write(_org2());
      await container.read(deviceCredentialProvider.notifier).hydrate();

      _expectSaleCleared(container);
    });
  });
}
