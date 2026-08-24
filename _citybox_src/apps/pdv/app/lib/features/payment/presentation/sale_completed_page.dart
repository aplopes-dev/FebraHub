import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/feedback/not_implemented_feedback.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/payment/application/complete_sale.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/non_fiscal_receipt_dialog.dart';
import 'package:citybox_pdv/features/shared/application/reset_open_sale.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';

/// Largura da coluna de ações — a tela é um cartaz, não um formulário: o
/// conteúdo fica centrado numa faixa, não esparramado pela janela.
const double _actionsWidth = 440;

/// Largura do aviso de conclusão, usada para calcular a margem que o empurra
/// para o canto inferior direito (ver `_showToast`).
const double _toastWidth = 340;

/// Confirmação de venda fechada, com os caminhos de saída.
///
/// A gravação no ERP + turno local já aconteceu na tela de Pagamento. Aqui
/// só limpamos o carrinho, fechamos conta de salão e mostramos o cupom.
class SaleCompletedPage extends ConsumerStatefulWidget {
  const SaleCompletedPage({super.key});

  @override
  ConsumerState<SaleCompletedPage> createState() => _SaleCompletedPageState();
}

class _SaleCompletedPageState extends ConsumerState<SaleCompletedPage> {
  ScaffoldMessengerState? _messenger;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) {
        return;
      }
      final String? accountId = ref.read(activeAccountIdProvider);
      if (accountId != null) {
        final SaleRecord? sale = ref.read(lastCompletedSaleProvider);
        await ref.read(salonProvider.notifier).closeAccount(
          accountId,
          saleOrderId: sale?.serverSaleId,
        );
        try {
          await ref.read(salonProvider.notifier).refreshDeliveryOrders();
        } on Object {
          // Espelho local já tem saleOrderId; poll corrige depois.
        }
      }
      if (!mounted) {
        return;
      }
      resetOpenSale(ref.read);
      final SaleRecord? sale = ref.read(lastCompletedSaleProvider);
      if (sale != null) {
        await showNonFiscalReceiptDialog(context, sale: sale);
      }
      if (!mounted) {
        return;
      }
      _showToast();
    });
  }

  void _showToast() {
    final double screenWidth = MediaQuery.sizeOf(context).width;
    final double leftMargin = (screenWidth - _toastWidth - PdvSpacing.xl).clamp(
      0,
      double.infinity,
    );

    // Sem `SnackBarAction`: com FECHAR o Material trata o aviso como
    // persistente na prática (fica até o toque) e sobra na tela de detalhe.
    final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);
    _messenger = messenger;
    messenger
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Text(
            'Venda finalizada com sucesso!',
            style: PdvTypography.bodyMd.copyWith(
              color: PdvCounterColors.onPayment,
            ),
            overflow: TextOverflow.ellipsis,
          ),
          backgroundColor: PdvCounterColors.payment,
          behavior: SnackBarBehavior.floating,
          margin: EdgeInsets.only(
            left: leftMargin,
            right: PdvSpacing.xl,
            bottom: PdvSpacing.xl,
          ),
          duration: const Duration(seconds: 3),
        ),
      );
  }

  @override
  void dispose() {
    // Saiu da tela de conclusão — não levar o toast para Últimas vendas.
    _messenger?.clearSnackBars();
    super.dispose();
  }

  void _goHome() {
    final String? returnTo =
        GoRouterState.of(context).uri.queryParameters['returnTo'];
    if (returnTo != null && returnTo.isNotEmpty) {
      context.go(returnTo);
    } else {
      context.go(PdvRoutes.home);
    }
  }

  void _openCounter() {
    context.go(PdvRoutes.counter);
  }

  void _openDelivery() {
    context.go(PdvRoutes.deliveryOrders);
  }

  void _openService() {
    context.go(PdvRoutes.service);
  }

  Future<void> _openReceipt() async {
    final SaleRecord? sale = ref.read(lastCompletedSaleProvider);
    if (sale == null) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Cupom desta venda não está disponível.')),
      );
      return;
    }
    await showNonFiscalReceiptDialog(context, sale: sale);
  }

  @override
  Widget build(BuildContext context) {
    final ModuleSetSnapshot modules = ref.watch(moduleVisibilityProvider);
    final bool showDelivery = modules.isOperationallyVisible(
      PdvModuleIds.deliveryOrders,
    );
    final bool showService = modules.isOperationallyVisible(
      PdvModuleIds.service,
    );

    return PdvScaffold(
      showBack: false,
      body: Center(
        child: SizedBox(
          width: _actionsWidth,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                const _SuccessHeadline(),
                const SizedBox(height: PdvSpacing.xxl),
                _ActionTile(
                  icon: Icons.home_outlined,
                  label: 'INÍCIO',
                  shortcut: 'HOME',
                  color: PdvCounterColors.payment,
                  foreground: PdvCounterColors.onPayment,
                  onPressed: _goHome,
                ),
                const SizedBox(height: PdvSpacing.sm),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: _ActionTile(
                        icon: Icons.shopping_cart_outlined,
                        label: 'BALCÃO',
                        shortcut: 'B',
                        color: PdvActionColors.counter,
                        onPressed: _openCounter,
                      ),
                    ),
                    if (showDelivery) ...<Widget>[
                      const SizedBox(width: PdvSpacing.sm),
                      Expanded(
                        child: _ActionTile(
                          icon: Icons.delivery_dining_outlined,
                          label: 'DELIVERY',
                          shortcut: 'D',
                          color: PdvActionColors.delivery,
                          onPressed: _openDelivery,
                        ),
                      ),
                    ],
                  ],
                ),
                if (showService) ...<Widget>[
                  const SizedBox(height: PdvSpacing.sm),
                  _ActionTile(
                    icon: Icons.room_service_outlined,
                    label: 'ATENDIMENTOS',
                    shortcut: 'A',
                    color: PdvActionColors.service,
                    onPressed: _openService,
                  ),
                ],
                const SizedBox(height: PdvSpacing.xxl),
                Row(
                  children: <Widget>[
                    Expanded(
                      child: _SecondaryAction(
                        icon: Icons.receipt_long_outlined,
                        label: 'CUPOM',
                        shortcut: 'F8',
                        onPressed: () {
                          _openReceipt();
                        },
                      ),
                    ),
                    const SizedBox(width: PdvSpacing.sm),
                    Expanded(
                      child: _SecondaryAction(
                        icon: Icons.print_outlined,
                        label: 'RELATÓRIO GERENCIAL',
                        shortcut: 'F7',
                        onPressed:
                            () => showNotImplementedFeedback(
                              context,
                              'Relatório gerencial',
                            ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: PdvSpacing.sm),
                _SecondaryAction(
                  icon: Icons.mail_outline,
                  label: 'ENVIAR NOTA FISCAL POR EMAIL',
                  onPressed:
                      () => showNotImplementedFeedback(
                        context,
                        'Enviar nota fiscal por email',
                      ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SuccessHeadline extends StatelessWidget {
  const _SuccessHeadline();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Icon(
          Icons.check_circle_outline,
          size: PdvSizes.iconXl,
          color: PdvCounterColors.payment,
        ),
        const SizedBox(width: PdvSpacing.md),
        Expanded(
          child: Text(
            'Venda concluída',
            style: PdvTypography.headingLg.copyWith(
              color: PdvColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}

class _ActionTile extends StatelessWidget {
  const _ActionTile({
    required this.icon,
    required this.label,
    required this.shortcut,
    required this.color,
    required this.onPressed,
    this.foreground,
  });

  final IconData icon;
  final String label;
  final String shortcut;
  final Color color;
  final Color? foreground;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final Color fg = foreground ?? PdvColors.onBrand;
    return SizedBox(
      height: PdvSizes.controlHeightLg,
      child: FilledButton(
        style: FilledButton.styleFrom(
          backgroundColor: color,
          foregroundColor: fg,
        ),
        onPressed: onPressed,
        child: Row(
          children: <Widget>[
            Icon(icon, color: fg),
            const SizedBox(width: PdvSpacing.sm),
            Expanded(
              child: Text(
                label,
                style: PdvTypography.label.copyWith(color: fg),
              ),
            ),
            Text(
              shortcut,
              style: PdvTypography.caption.copyWith(color: fg.withValues(alpha: 0.8)),
            ),
          ],
        ),
      ),
    );
  }
}

class _SecondaryAction extends StatelessWidget {
  const _SecondaryAction({
    required this.icon,
    required this.label,
    required this.onPressed,
    this.shortcut,
  });

  final IconData icon;
  final String label;
  final String? shortcut;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: PdvSizes.controlHeight,
      child: OutlinedButton(
        onPressed: onPressed,
        child: Row(
          children: <Widget>[
            Icon(icon, size: PdvSizes.iconMd),
            const SizedBox(width: PdvSpacing.sm),
            Expanded(
              child: Text(label, style: PdvTypography.labelSm),
            ),
            if (shortcut != null)
              Text(shortcut!, style: PdvTypography.caption),
          ],
        ),
      ),
    );
  }
}
