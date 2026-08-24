import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/feedback/not_implemented_feedback.dart';
import 'package:citybox_pdv/core/layout/pdv_breakpoints.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/presentation/pick_counter_customer.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_counter_draft.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/shared/application/reset_open_sale.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';

/// App bar da tela de Balcão.
class CounterAppBar extends ConsumerWidget {
  const CounterAppBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Customer? customer = ref.watch(counterCustomerProvider);
    final String customerLabel = CounterCustomerController.labelOf(customer);
    final String establishmentName = ref.watch(establishmentNameProvider);
    final ModuleSetSnapshot modules = ref.watch(moduleVisibilityProvider);
    final bool showCustomer = modules.isOperationallyVisible(
      PdvModuleIds.customer,
    );
    final bool showTabs = modules.isOperationallyVisible(PdvModuleIds.tabs);
    final bool iconOnly =
        !PdvLayout.ofWidth(MediaQuery.sizeOf(context).width).isExpanded;

    return PdvAppBarChrome(
      // Venda em andamento: o turno recusa o fechamento enquanto houver
      // carrinho ou pagamento lançado, então o botão só saberia dar erro.
      showCloseShift: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.lg),
        child: Row(
          children: <Widget>[
            PdvAppBarButton(
              icon: Icons.chevron_left,
              label: iconOnly ? null : 'Voltar',
              tooltip: 'Voltar',
              iconSize: PdvSizes.iconLg,
              horizontalPadding: PdvSpacing.lg,
              onPressed: () => _onBack(context, ref),
            ),
            if (showCustomer) ...<Widget>[
              const _AppBarSeparator(),
              PdvAppBarButton(
                icon: Icons.person_outline,
                label: iconOnly ? null : customerLabel,
                tooltip: customerLabel,
                onPressed: () {
                  final String? accountId = ref.read(activeAccountIdProvider);
                  final SalonAccount? account =
                      accountId == null
                          ? null
                          : ref
                              .read(salonProvider.notifier)
                              .accountById(accountId);
                  final String? deliveryOrderId = account?.deliveryOrderId;
                  DeliveryOrder? deliveryOrder;
                  if (deliveryOrderId != null) {
                    for (final DeliveryOrder order
                        in ref.read(salonProvider).deliveryOrders) {
                      if (order.id == deliveryOrderId) {
                        deliveryOrder = order;
                        break;
                      }
                    }
                  }
                  if (deliveryOrder?.isPaid == true) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Cliente não pode ser alterado após o pagamento.',
                        ),
                      ),
                    );
                    return;
                  }
                  onPickCounterCustomer(context, ref)();
                },
              ),
            ],
            const Spacer(),
            if (showTabs)
              PdvAppBarButton(
                icon: Icons.receipt_long_outlined,
                label: iconOnly ? null : 'Comandas',
                tooltip: 'Comandas',
                onPressed: () {
                  context.push(PdvRoutes.tabs);
                },
              ),
            PdvAppBarButton(
              icon: Icons.storefront_outlined,
              label: iconOnly ? null : establishmentName,
              tooltip: establishmentName,
              onPressed:
                  () => showNotImplementedFeedback(context, establishmentName),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _onBack(BuildContext context, WidgetRef ref) async {
    final String? accountId = ref.read(activeAccountIdProvider);
    final SalonAccount? account =
        accountId == null
            ? null
            : ref.read(salonProvider.notifier).accountById(accountId);

    String? returnTo;
    try {
      returnTo = GoRouterState.of(context).uri.queryParameters['returnTo'];
    } on Object {
      returnTo = null;
    }

    if (isUncommittedDeliveryAccount(account)) {
      final bool hasItems = ref.read(counterCartProvider).isNotEmpty;
      if (hasItems) {
        final bool? discard = await showDialog<bool>(
          context: context,
          builder:
              (BuildContext dialogContext) => AlertDialog(
                title: const Text('Descartar pedido?'),
                content: const Text(
                  'O rascunho ainda não foi salvo no Kanban. '
                  'Os itens lançados serão perdidos.',
                ),
                actions: <Widget>[
                  TextButton(
                    onPressed: () => Navigator.of(dialogContext).pop(false),
                    child: const Text('Continuar editando'),
                  ),
                  FilledButton(
                    onPressed: () => Navigator.of(dialogContext).pop(true),
                    child: const Text('Descartar'),
                  ),
                ],
              ),
        );
        if (discard != true) {
          return;
        }
      }
      if (!context.mounted) return;
      await ref.read(salonProvider.notifier).discardDeliveryDraft(account!.id);
      ref.read(activeAccountIdProvider.notifier).state = null;
      resetOpenSale(ref.read);
      if (!context.mounted) return;
      context.go(
        (returnTo == null || returnTo.isEmpty)
            ? PdvRoutes.deliveryOrders
            : returnTo,
      );
      return;
    }

    if (context.canPop()) {
      context.pop();
    } else if (returnTo != null && returnTo.isNotEmpty) {
      context.go(returnTo);
    } else {
      context.go(PdvRoutes.home);
    }
  }
}

class _AppBarSeparator extends StatelessWidget {
  const _AppBarSeparator();

  @override
  Widget build(BuildContext context) {
    return const VerticalDivider(
      width: PdvSpacing.lg,
      thickness: PdvSizes.borderWidthFocus,
      color: PdvAppBarColors.separator,
    );
  }
}
