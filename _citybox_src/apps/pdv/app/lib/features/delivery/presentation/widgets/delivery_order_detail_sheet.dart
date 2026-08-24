import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/delivery/data/pos_delivery_api.dart';
import 'package:citybox_pdv/features/delivery/domain/delivery_order.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/non_fiscal_receipt_dialog.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Resultado das ações do detalhe do pedido.
enum DeliveryOrderDetailAction { openCounter, pay, advanced, cancelled }

/// Folha lateral com itens, totais e ações do pedido.
Future<DeliveryOrderDetailAction?> showDeliveryOrderDetailSheet(
  BuildContext context, {
  required DeliveryOrder order,
}) {
  return showGeneralDialog<DeliveryOrderDetailAction>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Fechar detalhe do pedido',
    barrierColor: PdvColors.barrier,
    transitionDuration: PdvMotion.normal,
    pageBuilder: (_, __, ___) => const SizedBox.shrink(),
    transitionBuilder: (BuildContext ctx, Animation<double> animation, _, __) {
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(1, 0),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: PdvMotion.curve)),
        child: Align(
          alignment: Alignment.centerRight,
          child: _DetailSheet(orderId: order.id),
        ),
      );
    },
  );
}

class _DetailSheet extends ConsumerStatefulWidget {
  const _DetailSheet({required this.orderId});

  final String orderId;

  @override
  ConsumerState<_DetailSheet> createState() => _DetailSheetState();
}

class _DetailSheetState extends ConsumerState<_DetailSheet> {
  bool _busy = false;
  List<PosCourier> _couriers = const <PosCourier>[];
  bool _loadingCouriers = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadCouriers());
  }

  Future<void> _loadCouriers() async {
    setState(() => _loadingCouriers = true);
    try {
      final List<PosCourier> couriers =
          await ref.read(posDeliveryApiProvider).listCouriers();
      if (!mounted) return;
      setState(() => _couriers = couriers);
    } on PdvApiException {
      // Picker fica vazio; o operador ainda vê o entregador atual.
    } finally {
      if (mounted) setState(() => _loadingCouriers = false);
    }
  }

  DeliveryOrder? _orderOf(SalonSnapshot snap) {
    for (final DeliveryOrder order in snap.deliveryOrders) {
      if (order.id == widget.orderId) return order;
    }
    return null;
  }

  SalonAccount? _accountOf(SalonSnapshot snap, DeliveryOrder order) {
    final String? accountId = order.accountId;
    if (accountId == null) return null;
    return ref.read(salonProvider.notifier).accountById(accountId);
  }

  DeliveryOrderStatus? _nextStatus(DeliveryOrderStatus status) {
    return switch (status) {
      DeliveryOrderStatus.received => DeliveryOrderStatus.preparing,
      DeliveryOrderStatus.preparing => DeliveryOrderStatus.dispatched,
      DeliveryOrderStatus.dispatched => DeliveryOrderStatus.delivered,
      _ => null,
    };
  }

  Future<void> _advance(DeliveryOrder order) async {
    final DeliveryOrderStatus? next = _nextStatus(order.status);
    if (next == null) return;
    setState(() => _busy = true);
    try {
      await ref.read(salonProvider.notifier).updateDeliveryStatus(order.id, next);
      if (!mounted) return;
      Navigator.pop(context, DeliveryOrderDetailAction.advanced);
    } on PdvApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _assignCourier(DeliveryOrder order, PosCourier? courier) async {
    setState(() => _busy = true);
    try {
      await ref.read(salonProvider.notifier).updateDeliveryHeader(order.id, <
        String,
        dynamic
      >{'courierId': courier?.id, 'courierName': courier?.name ?? ''});
    } on PdvApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _cancel(DeliveryOrder order) async {
    final String? accountId = order.accountId;
    if (accountId == null) return;
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder:
          (BuildContext ctx) => AlertDialog(
            title: const Text('Cancelar pedido?'),
            content: Text(
              'O pedido #${order.number == 0 ? order.id : order.number} '
              'será cancelado no servidor.',
            ),
            actions: <Widget>[
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Voltar'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Cancelar pedido'),
              ),
            ],
          ),
    );
    if (confirmed != true || !mounted) return;
    setState(() => _busy = true);
    try {
      await ref.read(salonProvider.notifier).cancelAccount(accountId);
      if (!mounted) return;
      Navigator.pop(context, DeliveryOrderDetailAction.cancelled);
    } on PdvApiException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openReceipt(DeliveryOrder order) async {
    final String? saleId = order.saleOrderId;
    if (saleId == null || saleId.isEmpty) return;
    SaleRecord? match;
    final shift = ref.read(cashShiftProvider);
    if (shift != null) {
      for (final SaleRecord sale in shift.sales) {
        if (sale.serverSaleId == saleId &&
            sale.status == SaleRecordStatus.completed) {
          match = sale;
          break;
        }
      }
    }
    if (match == null) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Recibo não encontrado neste turno. Abra em Últimas vendas.',
          ),
        ),
      );
      return;
    }
    await showNonFiscalReceiptDialog(context, sale: match);
  }

  @override
  Widget build(BuildContext context) {
    final SalonSnapshot snap = ref.watch(salonProvider);
    final DeliveryOrder? order = _orderOf(snap);
    if (order == null) {
      return Material(
        color: PdvColors.surface,
        child: SizedBox(
          width: PdvSizes.dialogLgWidth,
          height: double.infinity,
          child: Center(
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Pedido não encontrado'),
            ),
          ),
        ),
      );
    }

    final SalonAccount? account = _accountOf(snap, order);
    final DeliveryTone tone = deliveryToneOf(order, account);
    final List<CounterCartLine> lines = account?.lines ?? const <CounterCartLine>[];
    final DeliveryOrderStatus? next = _nextStatus(order.status);
    final bool canCancel =
        !order.isPaid &&
        order.status != DeliveryOrderStatus.delivered &&
        order.status != DeliveryOrderStatus.cancelled;
    final bool canPay =
        canCancel &&
        order.accountId != null &&
        (lines.isNotEmpty || order.goodsTotalCents > 0);
    final bool canOpenCounter =
        !order.isPaid &&
        order.status != DeliveryOrderStatus.delivered &&
        order.accountId != null;
    final bool canViewReceipt =
        order.saleOrderId != null && order.saleOrderId!.isNotEmpty;
    final bool isDelivery = order.fulfillment == DeliveryFulfillment.delivery;

    PosCourier? selectedCourier;
    for (final PosCourier c in _couriers) {
      if (c.id == order.courierId) {
        selectedCourier = c;
        break;
      }
    }

    return Material(
      color: PdvColors.surface,
      child: SizedBox(
        width: PdvSizes.dialogLgWidth,
        height: double.infinity,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  PdvSpacing.xl,
                  PdvSpacing.lg,
                  PdvSpacing.md,
                  PdvSpacing.md,
                ),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            order.number == 0
                                ? 'Pedido'
                                : 'Pedido #${order.number}',
                            style: PdvTypography.headingMd.copyWith(
                              color: PdvColors.textPrimary,
                            ),
                          ),
                          const SizedBox(height: PdvSpacing.xs),
                          Row(
                            children: <Widget>[
                              Container(
                                width: PdvSpacing.md,
                                height: PdvSpacing.md,
                                decoration: BoxDecoration(
                                  color: tone.color,
                                  borderRadius: PdvRadius.fullAll,
                                ),
                              ),
                              const SizedBox(width: PdvSpacing.sm),
                              Text(
                                tone.label,
                                style: PdvTypography.bodySm.copyWith(
                                  color: PdvColors.textSecondary,
                                ),
                              ),
                              const SizedBox(width: PdvSpacing.md),
                              Text(
                                order.fulfillment.label,
                                style: PdvTypography.bodySm.copyWith(
                                  color: PdvColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: _busy ? null : () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                      color: PdvColors.textSecondary,
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(PdvSpacing.xl),
                  children: <Widget>[
                    _LabelValue(
                      label: 'Cliente',
                      value: order.customerName ?? 'Sem cliente',
                    ),
                    if (order.addressText.isNotEmpty) ...<Widget>[
                      const SizedBox(height: PdvSpacing.md),
                      _LabelValue(label: 'Endereço', value: order.addressText),
                    ],
                    const SizedBox(height: PdvSpacing.md),
                    _LabelValue(
                      label: 'Horário',
                      value: _hhmm(order.createdAt),
                    ),
                    if (isDelivery) ...<Widget>[
                      const SizedBox(height: PdvSpacing.lg),
                      Text(
                        'Entregador',
                        style: PdvTypography.label.copyWith(
                          color: PdvColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: PdvSpacing.sm),
                      DropdownButtonFormField<PosCourier?>(
                        key: ValueKey<String?>('courier-${order.courierId}'),
                        initialValue: selectedCourier,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: PdvColors.surfaceMuted,
                          helperText:
                              _loadingCouriers
                                  ? 'Carregando…'
                                  : (order.courierName == null ||
                                          order.courierName!.isEmpty
                                      ? 'Nenhum entregador'
                                      : null),
                        ),
                        items: <DropdownMenuItem<PosCourier?>>[
                          const DropdownMenuItem<PosCourier?>(
                            value: null,
                            child: Text('Sem entregador'),
                          ),
                          for (final PosCourier courier in _couriers)
                            DropdownMenuItem<PosCourier?>(
                              value: courier,
                              child: Text(courier.name),
                            ),
                        ],
                        onChanged:
                            _busy ||
                                    _loadingCouriers ||
                                    order.status ==
                                        DeliveryOrderStatus.delivered
                                ? null
                                : (PosCourier? value) =>
                                    _assignCourier(order, value),
                      ),
                    ],
                    const SizedBox(height: PdvSpacing.xl),
                    Text(
                      'Itens',
                      style: PdvTypography.label.copyWith(
                        color: PdvColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: PdvSpacing.sm),
                    if (lines.isEmpty)
                      Text(
                        'Nenhum item lançado ainda.',
                        style: PdvTypography.bodySm.copyWith(
                          color: PdvColors.textDisabled,
                        ),
                      )
                    else
                      for (final CounterCartLine line in lines)
                        Padding(
                          padding: const EdgeInsets.only(bottom: PdvSpacing.sm),
                          child: Row(
                            children: <Widget>[
                              Expanded(
                                child: Text(
                                  '${line.quantity}× ${line.product.name}',
                                  style: PdvTypography.bodyMd.copyWith(
                                    color: PdvColors.textPrimary,
                                  ),
                                ),
                              ),
                              Text(
                                formatCents(line.totalCents),
                                style: PdvTypography.amountSm.copyWith(
                                  color: PdvColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                    const SizedBox(height: PdvSpacing.lg),
                    _MoneyRow(
                      label: 'Subtotal',
                      valueCents: order.goodsTotalCents,
                    ),
                    if (order.feeCents > 0)
                      _MoneyRow(
                        label: 'Taxa de entrega',
                        valueCents: order.feeCents,
                      ),
                    _MoneyRow(
                      label: 'Total',
                      valueCents: order.totalCents,
                      emphasize: true,
                    ),
                  ],
                ),
              ),
              const Divider(height: 1),
              Padding(
                padding: const EdgeInsets.all(PdvSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: <Widget>[
                    if (canOpenCounter)
                      FilledButton(
                        onPressed:
                            _busy
                                ? null
                                : () => Navigator.pop(
                                  context,
                                  DeliveryOrderDetailAction.openCounter,
                                ),
                        child: const Text('Abrir balcão'),
                      ),
                    if (canViewReceipt) ...<Widget>[
                      if (canOpenCounter) const SizedBox(height: PdvSpacing.sm),
                      FilledButton(
                        onPressed: _busy ? null : () => _openReceipt(order),
                        child: const Text('Ver recibo'),
                      ),
                    ],
                    if (canPay) ...<Widget>[
                      const SizedBox(height: PdvSpacing.sm),
                      FilledButton(
                        onPressed:
                            _busy
                                ? null
                                : () => Navigator.pop(
                                  context,
                                  DeliveryOrderDetailAction.pay,
                                ),
                        child: const Text('Registrar pagamento'),
                      ),
                    ],
                    if (next != null) ...<Widget>[
                      const SizedBox(height: PdvSpacing.sm),
                      OutlinedButton(
                        onPressed: _busy ? null : () => _advance(order),
                        child: Text(_advanceLabel(order.status)),
                      ),
                    ],
                    if (canCancel) ...<Widget>[
                      const SizedBox(height: PdvSpacing.sm),
                      TextButton(
                        onPressed: _busy ? null : () => _cancel(order),
                        style: TextButton.styleFrom(
                          foregroundColor: PdvColors.danger,
                        ),
                        child: const Text('Cancelar pedido'),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _LabelValue extends StatelessWidget {
  const _LabelValue({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          label,
          style: PdvTypography.label.copyWith(color: PdvColors.textSecondary),
        ),
        const SizedBox(height: PdvSpacing.xs),
        Text(
          value,
          style: PdvTypography.bodyMd.copyWith(color: PdvColors.textPrimary),
        ),
      ],
    );
  }
}

class _MoneyRow extends StatelessWidget {
  const _MoneyRow({
    required this.label,
    required this.valueCents,
    this.emphasize = false,
  });

  final String label;
  final int valueCents;
  final bool emphasize;

  @override
  Widget build(BuildContext context) {
    final TextStyle style =
        emphasize
            ? PdvTypography.amountSm.copyWith(color: PdvColors.textPrimary)
            : PdvTypography.bodyMd.copyWith(color: PdvColors.textSecondary);
    return Padding(
      padding: const EdgeInsets.only(bottom: PdvSpacing.xs),
      child: Row(
        children: <Widget>[
          Expanded(child: Text(label, style: style)),
          Text(formatCents(valueCents), style: style),
        ],
      ),
    );
  }
}

String _advanceLabel(DeliveryOrderStatus status) => switch (status) {
  DeliveryOrderStatus.received => 'Iniciar preparo',
  DeliveryOrderStatus.preparing => 'Despachar pedido',
  DeliveryOrderStatus.dispatched => 'Marcar como concluído',
  _ => 'Avançar pedido',
};

String _hhmm(DateTime value) {
  final DateTime local = value.toLocal();
  return '${local.hour.toString().padLeft(2, '0')}:'
      '${local.minute.toString().padLeft(2, '0')}';
}
