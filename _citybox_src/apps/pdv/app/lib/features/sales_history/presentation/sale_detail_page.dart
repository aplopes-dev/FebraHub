import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/display_sale_number.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/application/supervisor_authorization.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/operators/presentation/offline_blocked_dialog.dart';
import 'package:citybox_pdv/features/payment/application/complete_sale.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/non_fiscal_receipt_dialog.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';
import 'package:citybox_pdv/features/policies/presentation/exception_gate.dart';
import 'package:citybox_pdv/features/sales_history/application/cancel_sale_error_message.dart';
import 'package:citybox_pdv/features/shared/application/connectivity_controller.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_form_section.dart';

class SaleDetailPage extends ConsumerWidget {
  const SaleDetailPage({required this.saleId, super.key});

  final String saleId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final CashShift? shift = ref.watch(cashShiftProvider);
    SaleRecord? sale;
    if (shift != null) {
      for (final SaleRecord s in shift.sales) {
        if (s.id == saleId) {
          sale = s;
          break;
        }
      }
    }

    if (sale == null) {
      return PdvScaffold(
        appBar: PdvAppBarChrome(
          child: Row(
            children: <Widget>[
              PdvAppBarButton(
                icon: Icons.arrow_back,
                label: 'Voltar',
                onPressed: () => context.pop(),
              ),
            ],
          ),
        ),
        body: const PdvEmptyState(title: 'Venda não encontrada'),
      );
    }

    final SaleRecord record = sale;
    final bool cancelled = record.status == SaleRecordStatus.cancelled;

    return PdvScaffold(
      appBar: PdvAppBarChrome(
        child: Row(
          children: <Widget>[
            PdvAppBarButton(
              icon: Icons.arrow_back,
              label: 'Voltar',
              onPressed: () => context.pop(),
            ),
          ],
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(PdvSpacing.xl),
        children: <Widget>[
          Text(
            formatCents(record.totalCents),
            style: PdvTypography.amountXl.copyWith(
              color: PdvColors.textPrimary,
            ),
          ),
          const SizedBox(height: PdvSpacing.sm),
          Text(
            cancelled ? 'Cancelada' : 'Concluída',
            style: PdvTypography.label.copyWith(
              color: cancelled ? PdvColors.danger : PdvColors.success,
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          // Operador e vendedor lado a lado, nunca fundidos: um responde
          // "quem digitou" (auditoria), o outro "de quem é a comissão".
          Text(
            'Operador: ${record.operatorName ?? '—'}',
            style: PdvTypography.bodyLg,
          ),
          if (record.sellerName != null) ...<Widget>[
            const SizedBox(height: PdvSpacing.sm),
            Text('Vendedor: ${record.sellerName}', style: PdvTypography.bodyLg),
          ],
          if (record.note != null) ...<Widget>[
            const SizedBox(height: PdvSpacing.sm),
            Text('Obs.: ${record.note}', style: PdvTypography.bodyMd),
          ],
          const SizedBox(height: PdvSpacing.xl),
          PdvFormSection(
            title: 'Itens',
            children: <Widget>[
              for (final SaleLineSnapshot line in record.lines)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(line.name, style: PdvTypography.bodyLg),
                  subtitle: Text(
                    '${line.quantity} × ${formatCents(line.unitPriceCents)}',
                    style: PdvTypography.bodySm,
                  ),
                  trailing: Text(
                    formatCents(line.lineTotalCents),
                    style: PdvTypography.amountSm,
                  ),
                ),
            ],
          ),
          const SizedBox(height: PdvSpacing.xl),
          PdvFormSection(
            title: 'Pagamentos',
            children: <Widget>[
              for (final SalePaymentSnapshot p in record.payments)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(p.methodLabel, style: PdvTypography.bodyLg),
                  trailing: Text(
                    formatCents(p.amountCents),
                    style: PdvTypography.amountSm,
                  ),
                ),
            ],
          ),
          const SizedBox(height: PdvSpacing.xxl),
          SizedBox(
            height: PdvSizes.controlHeight,
            child: OutlinedButton(
              onPressed: () {
                showNonFiscalReceiptDialog(context, sale: record);
              },
              child: const Text('Reimprimir'),
            ),
          ),
          if (!cancelled) ...<Widget>[
            const SizedBox(height: PdvSpacing.md),
            SizedBox(
              height: PdvSizes.controlHeightLg,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: PdvColors.danger,
                  foregroundColor: PdvColors.onBrand,
                ),
                onPressed: () => _cancelSale(context, ref, record),
                child: const Text('Cancelar venda'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _cancelSale(
    BuildContext context,
    WidgetRef ref,
    SaleRecord record,
  ) async {
    final bool? ok = await showDialog<bool>(
      context: context,
      builder: (BuildContext ctx) {
        return AlertDialog(
          title: const Text('Cancelar venda'),
          content: const PdvDialogBody(
            child: Text(
              'Confirma o cancelamento? O dinheiro líquido '
              'será estornado do esperado em gaveta.',
            ),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Não'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Cancelar venda'),
            ),
          ],
        );
      },
    );
    if (ok != true || !context.mounted) return;

    // Cancelamento é online-only: sem `serverSaleId` a venda nunca chegou ao
    // ERP; sem rede não dá para estornar estoque/recebíveis.
    final bool online = ref.read(terminalOnlineProvider);
    final String? remoteId = record.serverSaleId;
    if (!online || remoteId == null || remoteId.isEmpty) {
      if (!online) {
        await showOfflineBlockedDialog(
          context,
          operation: PosOperation.cancellation,
        );
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Esta venda não está no servidor e não pode ser cancelada.',
            ),
          ),
        );
      }
      return;
    }

    // Autorização **depois** da confirmação: chamar o supervisor
    // antes de o operador confirmar o desfecho gastaria o tempo
    // dele numa intenção que ainda pode ser abandonada.
    final ExceptionDecision decision = await requestException(
      context,
      ref,
      operation: PosOperation.cancellation,
      detail:
          'Venda ${displaySaleNumber(record)} '
          '— ${formatCents(record.totalCents)}',
    );

    if (decision is ExceptionRefused) return;
    final SupervisorAuthorization? authorization =
        decision is ExceptionAuthorized ? decision.authorization : null;

    if (!context.mounted) return;

    final PosOperator? operator = ref.read(operatorSessionProvider);
    if (operator == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Faça login do operador para cancelar.')),
      );
      return;
    }

    try {
      await ref.read(posSalesApiProvider).cancel(
        saleId: remoteId,
        operatorId: operator.id,
        authorizedByUserId: authorization?.operatorId,
      );
    } on PdvApiException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(cancelSaleErrorMessage(error))),
        );
      }
      return;
    }

    await ref
        .read(cashShiftProvider.notifier)
        .cancelSale(record.id, authorization: authorization);
    try {
      await ref.read(salonProvider.notifier).refreshDeliveryOrders();
    } on Object {
      // Kanban atualiza no próximo poll / entrada na tela.
    }
    if (context.mounted) {
      context.pop();
    }
  }
}
