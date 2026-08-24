import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/counter/application/food_charges_controller.dart';
import 'package:citybox_pdv/features/counter/application/invoice_document_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/customer/application/customer_catalog_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Account id da venda em curso (definido pela tela a partir da query da rota).
final StateProvider<String?> activeAccountIdProvider = StateProvider<String?>(
  (Ref ref) => null,
);

/// Prepara carrinho, taxas e cliente a partir de uma conta (ex.: pagar delivery
/// direto do Kanban, sem passar pelo Balcão).
void hydrateOpenSaleFromAccount(
  T Function<T>(ProviderListenable<T> provider) read,
  String accountId,
) {
  final SalonAccount? account = read(salonProvider.notifier).accountById(
    accountId,
  );
  if (account == null) {
    return;
  }
  read(activeAccountIdProvider.notifier).state = accountId;
  read(counterCartProvider.notifier).replaceAll(account.lines);

  final FoodChargesController charges = read(foodChargesProvider.notifier);
  if (account.couvert != null) {
    charges.setCouvert(
      unitCents: account.couvert!.unitCents,
      covers: account.couvert!.covers,
    );
  }
  charges.setServiceFee(enabled: account.serviceFeeEnabled);

  DeliveryOrder? deliveryOrder;
  int deliveryFee = 0;
  if (account.origin == SalonOrigin.delivery &&
      account.deliveryOrderId != null) {
    for (final DeliveryOrder o in read(salonProvider).deliveryOrders) {
      if (o.id == account.deliveryOrderId) {
        deliveryOrder = o;
        deliveryFee = o.feeCents;
        break;
      }
    }
  }
  charges.setDeliveryFeeCents(deliveryFee);

  if (account.origin == SalonOrigin.delivery) {
    final Customer? resolved = resolveCounterCustomerFromDelivery(
      customerId: deliveryOrder?.customerId ?? account.customerId,
      customerName: deliveryOrder?.customerName,
      catalog: read(customerCatalogProvider).items,
    );
    final CounterCustomerController customerCtrl = read(
      counterCustomerProvider.notifier,
    );
    if (resolved == null) {
      customerCtrl.clear();
    } else {
      customerCtrl.setCustomer(resolved);
      if (resolved.document.isNotEmpty) {
        read(invoiceDocumentProvider.notifier).applyCustomerDocument(
          resolved.document,
        );
      }
    }
  }
}

/// Sincroniza query `accountId` → provider + carrinho ↔ conta.
class ActiveAccountBinder extends ConsumerStatefulWidget {
  const ActiveAccountBinder({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<ActiveAccountBinder> createState() =>
      _ActiveAccountBinderState();
}

class _ActiveAccountBinderState extends ConsumerState<ActiveAccountBinder> {
  ProviderSubscription<List<CounterCartLine>>? _cartSub;
  Future<void> _lineSync = Future<void>.value();
  String? _boundAccountId;
  bool _hydrated = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    String? accountId;
    try {
      accountId = GoRouterState.of(context).uri.queryParameters['accountId'];
    } on Object {
      accountId = null;
    }
    if (accountId == _boundAccountId) {
      return;
    }
    _boundAccountId = accountId;
    _hydrated = false;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      ref.read(activeAccountIdProvider.notifier).state = accountId;
      _bindCart(accountId);
    });
  }

  void _bindCart(String? accountId) {
    _cartSub?.close();
    _cartSub = null;
    if (accountId == null) {
      ref.read(foodChargesProvider.notifier).setDeliveryFeeCents(0);
      return;
    }
    final SalonAccount? account = ref
        .read(salonProvider.notifier)
        .accountById(accountId);
    if (account != null) {
      // Sempre alinhado à conta — evita carrinho fantasma de outra venda.
      ref.read(counterCartProvider.notifier).replaceAll(account.lines);
      _hydrated = true;
      final FoodChargesController charges = ref.read(
        foodChargesProvider.notifier,
      );
      if (account.couvert != null) {
        charges.setCouvert(
          unitCents: account.couvert!.unitCents,
          covers: account.couvert!.covers,
        );
      }
      charges.setServiceFee(enabled: account.serviceFeeEnabled);
      int deliveryFee = 0;
      DeliveryOrder? deliveryOrder;
      if (account.origin == SalonOrigin.delivery &&
          account.deliveryOrderId != null) {
        for (final DeliveryOrder o in ref.read(salonProvider).deliveryOrders) {
          if (o.id == account.deliveryOrderId) {
            deliveryOrder = o;
            deliveryFee = o.feeCents;
            break;
          }
        }
      }
      charges.setDeliveryFeeCents(deliveryFee);
      _hydrateCounterCustomer(account: account, deliveryOrder: deliveryOrder);
    }
    _cartSub = ref.listenManual<List<CounterCartLine>>(counterCartProvider, (
      List<CounterCartLine>? previous,
      List<CounterCartLine> next,
    ) {
      final String? id = ref.read(activeAccountIdProvider);
      if (id == null) {
        return;
      }
      _lineSync = _lineSync
          .then<void>(
            (_) =>
                ref.read(salonProvider.notifier).updateAccountLines(id, next),
          )
          .onError((Object error, StackTrace stackTrace) {
            if (!mounted) {
              return;
            }
            final String message =
                error is PdvApiException
                    ? error.message
                    : 'Não foi possível sincronizar os itens do delivery.';
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text(message)));
          });
    });
  }

  void _hydrateCounterCustomer({
    required SalonAccount account,
    DeliveryOrder? deliveryOrder,
  }) {
    if (account.origin != SalonOrigin.delivery) {
      return;
    }
    final Customer? resolved = resolveCounterCustomerFromDelivery(
      customerId: deliveryOrder?.customerId ?? account.customerId,
      customerName: deliveryOrder?.customerName,
      catalog: ref.read(customerCatalogProvider).items,
    );
    final CounterCustomerController customerCtrl = ref.read(
      counterCustomerProvider.notifier,
    );
    if (resolved == null) {
      customerCtrl.clear();
      return;
    }
    customerCtrl.setCustomer(resolved);
    if (resolved.document.isNotEmpty) {
      ref
          .read(invoiceDocumentProvider.notifier)
          .applyCustomerDocument(resolved.document);
    }
  }

  @override
  void dispose() {
    _cartSub?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
