import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_totals_provider.dart';
import 'package:citybox_pdv/features/counter/application/food_charges_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_document_row.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/sale_adjustment_row.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_counter_draft.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/shared/application/reset_open_sale.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';
import 'package:citybox_pdv/ui/pdv_money_field.dart';

/// Conta ativa do balcão é um pedido delivery (itens ≠ checkout obrigatório).
bool isDeliveryCounterSession({
  required String? activeAccountId,
  required SalonAccount? Function(String id) accountById,
}) {
  if (activeAccountId == null || activeAccountId.isEmpty) {
    return false;
  }
  final SalonAccount? account = accountById(activeAccountId);
  return account?.origin == SalonOrigin.delivery;
}

/// Painel de valores da venda: documento na nota, subtotal, desconto, total
/// e o botão de pagamento.
///
/// O botão de pagamento fica colado no rodapé do painel, separado dos valores
/// por todo o vão que sobrar — a distância é o que impede de acertá-lo por
/// engano ao mirar no total logo acima.
///
/// Em conta **delivery**, há dois caminhos: pagar agora ou salvar e voltar ao
/// Kanban (pagamento na entrega / depois).
class CounterTotalsPanel extends ConsumerStatefulWidget {
  const CounterTotalsPanel({super.key});

  @override
  ConsumerState<CounterTotalsPanel> createState() => _CounterTotalsPanelState();
}

class _CounterTotalsPanelState extends ConsumerState<CounterTotalsPanel> {
  bool _committing = false;

  @override
  Widget build(BuildContext context) {
    final CounterTotals totals = ref.watch(counterTotalsProvider);
    final String? activeAccountId = ref.watch(activeAccountIdProvider);
    final bool deliverySession = isDeliveryCounterSession(
      activeAccountId: activeAccountId,
      accountById:
          (String id) => ref.read(salonProvider.notifier).accountById(id),
    );
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: PdvCounterColors.background,
        border: Border(left: BorderSide(color: PdvCounterColors.border)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: <Widget>[
                const CounterDocumentRow(),
                const _PanelDivider(),
                _TotalsRow(
                  label: 'Produtos',
                  value: formatCents(totals.subtotalCents),
                  badgeCount: totals.itemCount,
                ),
                if (totals.discountCents > 0) ...<Widget>[
                  const _PanelDivider(),
                  _TotalsRow(
                    label: 'Desc. itens',
                    value: '−${formatCents(totals.discountCents)}',
                  ),
                ],
                if (totals.couvertCents > 0) ...<Widget>[
                  const _PanelDivider(),
                  _TotalsRow(
                    label: 'Couvert',
                    value: formatCents(totals.couvertCents),
                  ),
                ],
                if (totals.serviceFeeCents > 0) ...<Widget>[
                  const _PanelDivider(),
                  _TotalsRow(
                    label: 'Taxa de serviço',
                    value: formatCents(totals.serviceFeeCents),
                  ),
                ],
                if (totals.deliveryFeeCents > 0) ...<Widget>[
                  const _PanelDivider(),
                  _TotalsRow(
                    label: 'Taxa delivery',
                    value: formatCents(totals.deliveryFeeCents),
                  ),
                ],
                const _PanelDivider(),
                SaleAdjustmentRow(totals: totals),
                const _PanelDivider(),
                _TotalsRow(
                  label: 'Total',
                  value: formatCents(totals.totalCents),
                  emphasized: true,
                ),
                const _PanelDivider(),
                const _FoodChargesControls(),
              ],
            ),
          ),
          if (deliverySession)
            _DeliveryCheckoutActions(
              hasItems: totals.itemCount > 0,
              busy: _committing,
              onPayNow: () => _openPayment(totals),
              onSaveToKanban: () => _saveDeliveryAndReturn(totals),
            )
          else
            _PaymentButton(
              hasItems: totals.itemCount > 0,
              onPressed: () => _openPayment(totals),
            ),
        ],
      ),
    );
  }

  Future<void> _openPayment(CounterTotals totals) async {
    if (_committing) return;
    if (totals.itemCount == 0) {
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(
          const SnackBar(
            content: Text('Lance ao menos um produto antes de cobrar.'),
            duration: Duration(milliseconds: 2000),
          ),
        );
      return;
    }

    setState(() => _committing = true);
    try {
      String? accountId = ref.read(activeAccountIdProvider);
      final SalonAccount? account =
          accountId == null
              ? null
              : ref.read(salonProvider.notifier).accountById(accountId);
      if (isUncommittedDeliveryAccount(account)) {
        final List<CounterCartLine> lines = List<CounterCartLine>.of(
          ref.read(counterCartProvider),
        );
        final Customer? customer = ref.read(counterCustomerProvider);
        try {
          accountId = await ref
              .read(salonProvider.notifier)
              .commitDeliveryDraft(
                lines,
                customerId: customer?.id,
                customerName: customer?.name,
              );
          ref.read(activeAccountIdProvider.notifier).state = accountId;
        } on PdvApiException catch (error) {
          if (!mounted) return;
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(error.message)));
          return;
        } on Object catch (_) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Não foi possível criar o pedido de delivery.'),
            ),
          );
          return;
        }
      }

      if (!mounted) return;
      if (accountId != null) {
        final SalonAccount? committed = ref
            .read(salonProvider.notifier)
            .accountById(accountId);
        if (committed?.origin == SalonOrigin.delivery &&
            committed?.deliveryOrderId != null &&
            !isUncommittedDeliveryAccount(committed)) {
          final Customer? customer = ref.read(counterCustomerProvider);
          try {
            await ref
                .read(salonProvider.notifier)
                .syncDeliveryCustomerHeader(accountId, customer);
          } on PdvApiException catch (error) {
            if (!mounted) return;
            ScaffoldMessenger.of(
              context,
            ).showSnackBar(SnackBar(content: Text(error.message)));
            return;
          }
        }
        await ref.read(salonProvider.notifier).beginClose(accountId);
      }
      if (!mounted) return;

      String? returnTo;
      try {
        returnTo = GoRouterState.of(context).uri.queryParameters['returnTo'];
      } on Object {
        returnTo = null;
      }
      final StringBuffer path = StringBuffer(PdvRoutes.payment);
      final List<String> query = <String>[];
      if (accountId != null && accountId.isNotEmpty) {
        query.add('accountId=$accountId');
      }
      if (returnTo != null && returnTo.isNotEmpty) {
        query.add('returnTo=$returnTo');
      }
      if (query.isNotEmpty) {
        path.write('?${query.join('&')}');
      }
      context.push(path.toString());
    } finally {
      if (mounted) setState(() => _committing = false);
    }
  }

  Future<void> _saveDeliveryAndReturn(CounterTotals totals) async {
    if (_committing) return;
    if (totals.itemCount == 0) {
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(
          const SnackBar(
            content: Text('Lance ao menos um produto antes de salvar.'),
            duration: Duration(milliseconds: 2000),
          ),
        );
      return;
    }

    final String? accountId = ref.read(activeAccountIdProvider);
    if (accountId == null) {
      return;
    }

    setState(() => _committing = true);
    try {
      final List<CounterCartLine> lines = List<CounterCartLine>.of(
        ref.read(counterCartProvider),
      );
      final SalonAccount? account = ref
          .read(salonProvider.notifier)
          .accountById(accountId);
      final Customer? customer = ref.read(counterCustomerProvider);

      try {
        if (isUncommittedDeliveryAccount(account)) {
          await ref
              .read(salonProvider.notifier)
              .commitDeliveryDraft(
                lines,
                customerId: customer?.id,
                customerName: customer?.name,
              );
        } else {
          await ref
              .read(salonProvider.notifier)
              .updateAccountLines(accountId, lines);
          await ref
              .read(salonProvider.notifier)
              .syncDeliveryCustomerHeader(accountId, customer);
        }
      } on PdvApiException catch (error) {
        if (!mounted) return;
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(error.message)));
        return;
      } on Object catch (_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Não foi possível salvar os itens do delivery.'),
          ),
        );
        return;
      }

      if (!mounted) return;

      ref.read(activeAccountIdProvider.notifier).state = null;
      resetOpenSale(ref.read);

      String? returnTo;
      try {
        returnTo = GoRouterState.of(context).uri.queryParameters['returnTo'];
      } on Object {
        returnTo = null;
      }
      context.go(
        (returnTo == null || returnTo.isEmpty)
            ? PdvRoutes.deliveryOrders
            : returnTo,
      );
    } finally {
      if (mounted) setState(() => _committing = false);
    }
  }
}

class _PanelDivider extends StatelessWidget {
  const _PanelDivider();

  @override
  Widget build(BuildContext context) {
    return Divider(
      height: PdvSizes.borderWidth,
      color: PdvCounterColors.border,
    );
  }
}

class _TotalsRow extends StatelessWidget {
  const _TotalsRow({
    required this.label,
    required this.value,
    this.badgeCount,
    this.emphasized = false,
  });

  final String label;
  final String value;

  /// Quantidade a mostrar num selo à esquerda do valor — hoje só a linha
  /// "Produtos" usa. `null` não desenha selo nenhum.
  final int? badgeCount;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final TextStyle labelStyle = (emphasized
            ? PdvTypography.label
            : PdvTypography.bodySm)
        .copyWith(color: PdvCounterColors.foregroundMuted);
    final TextStyle valueStyle =
        (emphasized ? PdvTypography.headingMd : PdvTypography.bodyMd).copyWith(
          color: PdvCounterColors.foreground,
          fontFeatures: PdvTypography.tabular,
        );

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: PdvSpacing.md,
        vertical: PdvSpacing.md,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: <Widget>[
          Text(label, style: labelStyle),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              if (badgeCount != null) ...<Widget>[
                _CountBadge(count: badgeCount!),
                const SizedBox(width: PdvSpacing.sm),
              ],
              Text(value, style: valueStyle),
            ],
          ),
        ],
      ),
    );
  }
}

/// Selo com a quantidade de itens — soma das quantidades de cada linha, não
/// o número de produtos diferentes (ver `CounterTotals.itemCount`).
///
/// Cantos vivos, como o resto do app (ver `PdvRadius`): um selo redondo aqui
/// seria a única forma arredondada da tela, e destoaria mais do que ajudaria.
class _CountBadge extends StatelessWidget {
  const _CountBadge({required this.count});

  final int count;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(color: PdvCounterColors.accent),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: PdvSpacing.sm,
          vertical: PdvSpacing.xxs,
        ),
        child: Text(
          '$count',
          style: PdvTypography.labelSm.copyWith(color: PdvColors.onBrand),
        ),
      ),
    );
  }
}

class _PaymentButton extends StatelessWidget {
  const _PaymentButton({required this.hasItems, required this.onPressed});

  /// `false` com o carrinho vazio — nesse estado o botão fica amarelo
  /// ([PdvCounterColors.paymentEmpty]), não verde. Vira [PdvCounterColors
  /// .payment] assim que a primeira linha entra.
  final bool hasItems;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final Color background =
        hasItems ? PdvCounterColors.payment : PdvCounterColors.paymentEmpty;

    return SizedBox(
      height: PdvSizes.controlHeightLg,
      child: Material(
        color: background,
        child: InkWell(
          onTap: onPressed,
          // `Center`, e não confiar no `Row` sozinho: `CrossAxisAlignment
          // .baseline` (abaixo) alinha "PAGAMENTO" e "(F2)" pela própria
          // linha de base — bonito entre os dois, mas dimensiona a `Row`
          // pela altura que o texto precisa, não pela do botão. Sem o
          // `Center`, essa caixa menor nasce colada no topo dos 56 px do
          // botão, não no meio.
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: <Widget>[
                Text(
                  'PAGAMENTO',
                  style: PdvTypography.label.copyWith(
                    color: PdvCounterColors.onPayment,
                  ),
                ),
                const SizedBox(width: PdvSpacing.xs),
                Text(
                  '(F2)',
                  style: PdvTypography.caption.copyWith(
                    color: PdvCounterColors.onPayment,
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

/// CTAs do delivery: montar pedido e voltar ao Kanban (primário) ou pagar agora
/// (secundário). Hierarquia visual ≠ balcão normal (lá o verde é cobrança).
class _DeliveryCheckoutActions extends StatelessWidget {
  const _DeliveryCheckoutActions({
    required this.hasItems,
    required this.busy,
    required this.onPayNow,
    required this.onSaveToKanban,
  });

  final bool hasItems;
  final bool busy;
  final VoidCallback onPayNow;
  final VoidCallback onSaveToKanban;

  @override
  Widget build(BuildContext context) {
    final bool enabled = hasItems && !busy;
    final Color saveBackground =
        enabled ? PdvCounterColors.payment : PdvCounterColors.paymentEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        SizedBox(
          height: PdvSizes.controlHeightLg,
          child: Material(
            color: saveBackground,
            child: InkWell(
              onTap: enabled ? onSaveToKanban : null,
              child: Center(
                child:
                    busy
                        ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                        : Text(
                          'SALVAR E VOLTAR',
                          style: PdvTypography.label.copyWith(
                            color: PdvCounterColors.onPayment,
                          ),
                        ),
              ),
            ),
          ),
        ),
        SizedBox(
          height: PdvSizes.controlHeightLg,
          child: Material(
            color: PdvCounterColors.surfaceStrong,
            child: InkWell(
              onTap: enabled ? onPayNow : null,
              child: Center(
                child: Text(
                  'PAGAR AGORA',
                  style: PdvTypography.label.copyWith(
                    color:
                        enabled
                            ? PdvCounterColors.foreground
                            : PdvCounterColors.foregroundMuted,
                  ),
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _FoodChargesControls extends ConsumerWidget {
  const _FoodChargesControls();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ModuleSetSnapshot modules = ref.watch(moduleVisibilityProvider);
    final FoodChargesState charges = ref.watch(foodChargesProvider);
    final bool showFee = modules.isOperationallyVisible(
      PdvModuleIds.serviceFee,
    );
    final bool showCouvert = modules.isOperationallyVisible(
      PdvModuleIds.couvert,
    );
    if (!showFee && !showCouvert) {
      return const SizedBox.shrink();
    }
    return Padding(
      padding: const EdgeInsets.all(PdvSpacing.sm),
      child: Column(
        children: <Widget>[
          if (showFee)
            Material(
              color: Colors.transparent,
              child: SwitchListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                title: Text('Taxa 10%', style: PdvTypography.bodySm),
                value: charges.serviceFeeEnabled,
                onChanged: (bool v) {
                  ref
                      .read(foodChargesProvider.notifier)
                      .setServiceFee(enabled: v);
                },
              ),
            ),
          if (showCouvert)
            TextButton(
              onPressed: () async {
                final TextEditingController unit = TextEditingController(
                  text: '5,00',
                );
                final TextEditingController covers = TextEditingController(
                  text: '2',
                );
                final bool? ok = await showDialog<bool>(
                  context: context,
                  builder: (BuildContext context) {
                    return AlertDialog(
                      title: const Text('Couvert'),
                      content: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: <Widget>[
                          PdvMoneyField(
                            label: 'Valor unitário',
                            controller: unit,
                          ),
                          const SizedBox(height: PdvSpacing.md),
                          PdvFilledField(
                            label: 'Pessoas',
                            controller: covers,
                            keyboardType: TextInputType.number,
                          ),
                        ],
                      ),
                      actions: <Widget>[
                        TextButton(
                          onPressed: () => Navigator.pop(context, false),
                          child: const Text('Cancelar'),
                        ),
                        FilledButton(
                          onPressed: () => Navigator.pop(context, true),
                          child: const Text('Aplicar'),
                        ),
                      ],
                    );
                  },
                );
                if (ok == true) {
                  final int unitCents = PdvMoneyField.centsOf(unit);
                  final int people = int.tryParse(covers.text) ?? 0;
                  ref
                      .read(foodChargesProvider.notifier)
                      .setCouvert(unitCents: unitCents, covers: people);
                }
                unit.dispose();
                covers.dispose();
              },
              child: Text(
                charges.couvert == null ? 'Lançar couvert' : 'Editar couvert',
              ),
            ),
        ],
      ),
    );
  }
}
