import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_totals_provider.dart';
import 'package:citybox_pdv/features/counter/application/sale_adjustment_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const CounterProduct product = CounterProduct(
    id: 'p1',
    name: 'Item',
    priceCents: 1000,
    categoryId: 'c',
  );

  test('total never negative with huge discount', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);
    container.read(counterCartProvider.notifier).addProduct(product);
    container
        .read(saleAdjustmentProvider.notifier)
        .setAdjustment(
          const SaleAdjustment(
            kind: SaleAdjustmentKind.discount,
            mode: SaleAdjustmentMode.amount,
            amountCents: 99999,
          ),
        );
    expect(container.read(counterTotalsProvider).totalCents, 0);
  });

  test('empty cart ignores leftover adjustment on totals itemCount', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);
    container
        .read(saleAdjustmentProvider.notifier)
        .setAdjustment(
          const SaleAdjustment(
            kind: SaleAdjustmentKind.surcharge,
            mode: SaleAdjustmentMode.amount,
            amountCents: 100,
          ),
        );
    // Without items, UI blocks edit; totals still compute if state set.
    expect(container.read(counterTotalsProvider).itemCount, 0);
    expect(container.read(counterTotalsProvider).totalCents, 0);
  });

  test('XOR: surcharge replaces discount', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);
    container.read(counterCartProvider.notifier).addProduct(product);
    final SaleAdjustmentController adj = container.read(
      saleAdjustmentProvider.notifier,
    );
    adj.setAdjustment(
      const SaleAdjustment(
        kind: SaleAdjustmentKind.discount,
        mode: SaleAdjustmentMode.percent,
        percentBps: 1000,
      ),
    );
    expect(container.read(counterTotalsProvider).totalCents, 900);
    adj.setAdjustment(
      const SaleAdjustment(
        kind: SaleAdjustmentKind.surcharge,
        mode: SaleAdjustmentMode.amount,
        amountCents: 50,
      ),
    );
    expect(container.read(counterTotalsProvider).totalCents, 1050);
    expect(
      container.read(saleAdjustmentProvider)?.kind,
      SaleAdjustmentKind.surcharge,
    );
  });

  test('clearing cart clears adjustment', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);
    container.read(counterCartProvider.notifier).addProduct(product);
    container
        .read(saleAdjustmentProvider.notifier)
        .setAdjustment(
          const SaleAdjustment(
            kind: SaleAdjustmentKind.discount,
            mode: SaleAdjustmentMode.amount,
            amountCents: 100,
          ),
        );
    container.read(counterCartProvider.notifier).clear();
    expect(container.read(saleAdjustmentProvider), isNull);
  });
}
