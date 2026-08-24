import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/feedback/not_implemented_feedback.dart';
import 'package:citybox_pdv/core/layout/pdv_breakpoints.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/presentation/pick_counter_customer.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/payment/application/sale_note_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_seller_controller.dart';
import 'package:citybox_pdv/features/payment/application/terminal_sellers_controller.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/sale_note_dialog.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/seller_picker_dialog.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';

/// App bar da tela de Pagamento.
///
/// Mesma anatomia da do Balcão à esquerda — **Voltar** e o **cliente** da
/// venda —, e três botões a mais à direita: vendedor, observação da venda e
/// configurações. Eles só existem aqui porque é onde a venda é fechada: é o
/// último ponto em que trocar o vendedor ou anotar uma observação ainda
/// altera o cupom.
class PaymentAppBar extends ConsumerWidget {
  const PaymentAppBar({super.key});

  /// Escolhe o vendedor da venda. Fechar o diálogo sem confirmar não mexe no
  /// que já estava escolhido — ver [SellerSelection].
  Future<void> _pickSeller(BuildContext context, WidgetRef ref) async {
    final List<Seller> catalog =
        await ref.read(terminalSellersProvider.future);
    if (!context.mounted) return;
    final SellerSelection? selection = await showSellerPickerDialog(
      context,
      sellers: catalog,
      selected: ref.read(saleSellerProvider),
    );
    if (selection == null) {
      return;
    }

    final Seller? picked = selection.seller;
    final SaleSellerController controller = ref.read(
      saleSellerProvider.notifier,
    );
    if (picked == null) {
      controller.clear();
    } else {
      controller.select(picked);
    }
  }

  /// Anota a observação da venda. String vazia remove — o diálogo tem botão
  /// próprio para isso.
  Future<void> _editNote(BuildContext context, WidgetRef ref) async {
    final String? note = await showSaleNoteDialog(
      context,
      initialNote: ref.read(saleNoteProvider),
    );
    if (note == null) {
      return;
    }
    ref.read(saleNoteProvider.notifier).setNote(note);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final Customer? customer = ref.watch(counterCustomerProvider);
    final String customerLabel = CounterCustomerController.labelOf(customer);
    final String establishmentName = ref.watch(establishmentNameProvider);
    final Seller? seller = ref.watch(saleSellerProvider);
    final String note = ref.watch(saleNoteProvider);
    final ModuleSetSnapshot modules = ref.watch(moduleVisibilityProvider);
    final bool showCustomer = modules.isOperationallyVisible(
      PdvModuleIds.customer,
    );
    final bool showSeller = modules.isOperationallyVisible(PdvModuleIds.seller);
    final bool iconOnly =
        !PdvLayout.ofWidth(MediaQuery.sizeOf(context).width).isExpanded;

    return PdvAppBarChrome(
      // Mesma razão do Balcão: aqui a venda está aberta e o fechamento seria
      // recusado por `saleInProgress`.
      showCloseShift: false,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.lg),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Row(
                children: <Widget>[
                  PdvAppBarButton(
                    icon: Icons.chevron_left,
                    label: iconOnly ? null : 'Voltar',
                    tooltip: 'Voltar',
                    iconSize: PdvSizes.iconLg,
                    horizontalPadding: PdvSpacing.lg,
                    onPressed: () => Navigator.of(context).maybePop(),
                  ),
                  if (showCustomer) ...<Widget>[
                    const _AppBarSeparator(),
                    Flexible(
                      child: PdvAppBarButton(
                        icon: Icons.person_outline,
                        label: iconOnly ? null : customerLabel,
                        tooltip: customerLabel,
                        onPressed: onPickCounterCustomer(context, ref),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (showSeller)
              PdvAppBarButton(
                icon: Icons.groups_outlined,
                label: iconOnly ? null : seller?.label,
                tooltip:
                    seller == null
                        ? 'Vendedor'
                        : 'Vendedor: ${seller.code} — ${seller.name}',
                maxLabelWidth: _sellerLabelMaxWidth,
                onPressed: () => _pickSeller(context, ref),
              ),
            PdvAppBarButton(
              icon: note.isEmpty ? Icons.edit_note : Icons.sticky_note_2,
              tooltip:
                  note.isEmpty ? 'Observação da venda' : 'Observação: $note',
              onPressed: () => _editNote(context, ref),
            ),
            PdvAppBarButton(
              icon: Icons.settings_outlined,
              tooltip: 'Configurações',
              onPressed: () => context.push(PdvRoutes.settings),
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
}

/// Teto do rótulo do vendedor na barra. Cobre "Ana Beatriz Marques" inteiro e
/// corta com reticências a partir daí.
const double _sellerLabelMaxWidth = 200;

/// Traço vertical entre Voltar e Cliente — o mesmo da app bar do Balcão.
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
