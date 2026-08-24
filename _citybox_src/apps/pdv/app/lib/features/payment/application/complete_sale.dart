import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/brazilian_masks.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_net.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_document_type_controller.dart';
import 'package:citybox_pdv/features/counter/application/counter_totals_provider.dart';
import 'package:citybox_pdv/features/counter/application/invoice_document_controller.dart';
import 'package:citybox_pdv/features/counter/application/sale_adjustment_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/payment/application/payment_entries_controller.dart';
import 'package:citybox_pdv/features/payment/application/payment_summary_provider.dart';
import 'package:citybox_pdv/features/payment/application/sale_note_controller.dart';
import 'package:citybox_pdv/features/payment/application/sale_seller_controller.dart';
import 'package:citybox_pdv/features/payment/data/pos_sales_api.dart';
import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';
import 'package:citybox_pdv/features/payment/domain/payment_summary.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/tables/application/active_account_sync.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Soma qty/peso vendidos por produto (para frescor local do catálogo).
Map<String, double> soldQuantitiesFromCart(List<CounterCartLine> lines) {
  final Map<String, double> sold = <String, double>{};
  for (final CounterCartLine line in lines) {
    if (!line.product.trackStock) {
      continue;
    }
    final double qty = line.weightKg ?? line.quantity.toDouble();
    sold.update(
      line.product.id,
      (double current) => current + qty,
      ifAbsent: () => qty,
    );
  }
  return sold;
}

final Provider<PosSalesApi> posSalesApiProvider = Provider<PosSalesApi>(
  (Ref ref) => PosSalesApi(ref.watch(pdvApiClientProvider)),
);

/// Última venda concluída nesta sessão (cupom / reimpressão imediata).
final StateProvider<SaleRecord?> lastCompletedSaleProvider =
    StateProvider<SaleRecord?>((Ref ref) => null);

String? cardPaymentTypeForSystemKey(String? systemKey) => switch (systemKey) {
  'pm-pix' => 'pix',
  'pm-cartao' => 'credit',
  'pm-cartao-debito' => 'debit',
  _ => null,
};

/// Monta o body de `POST /v1/pos/sales` a partir do estado atual do PDV.
Map<String, dynamic> buildPosSaleBody({
  required String operatorId,
  required List<CounterCartLine> lines,
  required List<PaymentEntry> payments,
  required CounterTotals totals,
  Customer? customer,
  String? consumerDocument,
  Seller? seller,
  String? note,
  SaleAdjustment? saleAdjustment,
  String? posDeliveryOrderId,
}) {
  final int adjustment = totals.saleAdjustmentCents;
  final int discountsCents = adjustment < 0 ? -adjustment : 0;
  final int surchargeCents = adjustment > 0 ? adjustment : 0;
  final String? discountAuthorizer = saleAdjustment?.authorizedByOperatorId;

  return <String, dynamic>{
    'operatorId': operatorId,
    if (customer != null && customer.id.isNotEmpty) 'customerId': customer.id,
    'customerName': customer?.name ?? 'Consumidor Final',
    if (consumerDocument != null && consumerDocument.isNotEmpty)
      'consumerDocument': consumerDocument,
    if (seller != null) 'sellerId': seller.id,
    if (seller != null) 'sellerName': seller.name,
    if (note != null && note.isNotEmpty) 'notes': note,
    if (posDeliveryOrderId != null) 'posDeliveryOrderId': posDeliveryOrderId,
    // No POS, deliveryFeeCents agrega frete + encargos food (couvert/serviço)
    // + acréscimo — igual ao balcão sem delivery e ao total do painel.
    'deliveryFeeCents':
        totals.deliveryFeeCents +
        totals.couvertCents +
        totals.serviceFeeCents +
        surchargeCents,
    'discountsCents': discountsCents,
    if (discountAuthorizer != null && discountAuthorizer.isNotEmpty)
      'discountAuthorizedByUserId': discountAuthorizer,
    'lines': <Map<String, dynamic>>[
      for (final CounterCartLine line in lines)
        <String, dynamic>{
          // Sempre o Product UUID do ERP. `skuId` de grade é composto
          // (`productId:option:option`) e falha no IsUUID do POST.
          'productId': line.product.id,
          'quantity': '${line.quantity}',
          'unitPriceCents':
              line.quantity <= 0
                  ? line.totalCents
                  : (line.totalCents / line.quantity).round(),
        },
    ],
    'payments': <Map<String, dynamic>>[
      for (final PaymentEntry entry in payments)
        <String, dynamic>{
          'methodId': entry.method.id,
          'amountCents': entry.amountCents,
          if (cardPaymentTypeForSystemKey(entry.method.systemKey) != null)
            'cardPaymentType': cardPaymentTypeForSystemKey(
              entry.method.systemKey,
            ),
          if (entry.brand != null) 'brand': entry.brand,
          if (entry.installments > 1) 'installments': entry.installments,
        },
    ],
  };
}

/// Valida CPF/CNPJ na nota (vazio ok; senão 11 ou 14 dígitos conforme tipo).
String? validateInvoiceDocument({
  required String digits,
  required CounterDocumentType type,
}) {
  final String clean = digitsOnly(digits);
  if (clean.isEmpty) {
    return null;
  }
  final int expected = type == CounterDocumentType.cpf ? 11 : 14;
  if (clean.length != expected) {
    return type == CounterDocumentType.cpf
        ? 'Informe um CPF completo (11 dígitos) ou deixe em branco.'
        : 'Informe um CNPJ completo (14 dígitos) ou deixe em branco.';
  }
  return null;
}

/// UUID canônico (ERP). Ids de fixture (`cash`, `pix`) falham no `IsUUID` da API.
final RegExp _erpUuidPattern = RegExp(
  r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$',
);

bool isErpUuid(String value) => _erpUuidPattern.hasMatch(value);

/// Finaliza a venda online: POST ERP → espelho local no turno.
///
/// Em falha lança [PdvApiException] ou [StateError] (turno/operador).
Future<SaleRecord> completeSaleOnline(WidgetRef ref) async {
  final CashShift? shift = ref.read(cashShiftProvider);
  if (shift == null || !shift.isOpen) {
    throw StateError('Abra o caixa antes de finalizar a venda.');
  }

  final PosOperator? operator = ref.read(operatorSessionProvider);
  if (operator == null) {
    throw StateError('Faça login do operador antes de finalizar.');
  }

  final List<CounterCartLine> lines = ref.read(counterCartProvider);
  final List<PaymentEntry> payments = ref.read(paymentEntriesProvider);
  if (lines.isEmpty) {
    throw StateError('Carrinho vazio.');
  }

  // Meio fixture (`cash`/`pix`) sobrevive se o draft nasceu antes do hydrate —
  // a API rejeita com IsUUID e a UI só mostrava erro genérico.
  for (final PaymentEntry entry in payments) {
    if (!isErpUuid(entry.method.id)) {
      throw StateError(
        'Forma de pagamento desatualizada. Remova os pagamentos, '
        'selecione o meio na lista e receba de novo.',
      );
    }
  }

  final CounterDocumentType docType = ref.read(counterDocumentTypeProvider);
  final String documentDigits = ref.read(invoiceDocumentProvider);
  final String? docError = validateInvoiceDocument(
    digits: documentDigits,
    type: docType,
  );
  if (docError != null) {
    throw StateError(docError);
  }

  final CounterTotals totals = ref.read(counterTotalsProvider);
  final PaymentSummary summary = ref.read(paymentSummaryProvider);
  final Seller? seller = ref.read(saleSellerProvider);
  final Customer? customer = ref.read(counterCustomerProvider);
  final String note = ref.read(saleNoteProvider);
  final SaleAdjustment? adjustment = ref.read(saleAdjustmentProvider);
  final String? activeAccountId = ref.read(activeAccountIdProvider);
  final SalonAccount? activeAccount =
      activeAccountId == null
          ? null
          : ref.read(salonProvider.notifier).accountById(activeAccountId);
  final String? posDeliveryOrderId =
      activeAccount?.origin == SalonOrigin.delivery
          ? activeAccount?.deliveryOrderId
          : null;
  final String? consumerDocument =
      documentDigits.isEmpty ? null : documentDigits;

  final Map<String, dynamic> body = buildPosSaleBody(
    operatorId: operator.id,
    lines: lines,
    payments: payments,
    totals: totals,
    customer: customer,
    consumerDocument: consumerDocument,
    seller: seller,
    note: note.isEmpty ? null : note,
    saleAdjustment: adjustment,
    posDeliveryOrderId: posDeliveryOrderId,
  );

  final PosSaleResult remote = await ref.read(posSalesApiProvider).create(body);

  final ({int cashReceivedCents, int changeCents, int cashNetCents}) cash =
      computeCashNet(entries: payments, summary: summary);

  final SaleRecord record = SaleRecord(
    id: remote.id,
    customerId: customer?.id,
    customerName: customer?.name ?? remote.customerName,
    consumerDocument: remote.consumerDocument ?? consumerDocument,
    serverSaleId: remote.id,
    serverNumber: remote.number,
    shiftId: shift.id,
    status: SaleRecordStatus.completed,
    createdAt: remote.createdAt,
    lines: <SaleLineSnapshot>[
      for (final CounterCartLine line in lines)
        SaleLineSnapshot(
          productId: line.product.id,
          name:
              line.half == null
                  ? line.product.name
                  : '½ ${line.half!.leftName} / ½ ${line.half!.rightName}',
          quantity: line.quantity,
          unitPriceCents: line.goodsUnitCents,
          lineTotalCents: line.totalCents,
          kitchenNote: line.kitchenNote,
          addonLabels: line.addons.map((CartAddon a) => a.name).toList(),
          halfLabel:
              line.half == null
                  ? null
                  : '½ ${line.half!.leftName} / ½ ${line.half!.rightName}',
        ),
    ],
    payments: <SalePaymentSnapshot>[
      for (final PaymentEntry e in payments)
        SalePaymentSnapshot(
          methodId: e.method.id,
          methodLabel: e.method.label,
          systemKey: e.method.systemKey,
          amountCents: e.amountCents,
          brand: e.brand,
          installments: e.installments,
        ),
    ],
    sellerId: seller?.id,
    sellerName: seller?.name,
    operatorId: operator.id,
    operatorName: operator.name,
    note: note.isEmpty ? null : note,
    subtotalCents: totals.linesNetCents,
    saleAdjustment: adjustment,
    totalCents: totals.totalCents,
    cashReceivedCents: cash.cashReceivedCents,
    changeCents: cash.changeCents,
    cashNetCents: cash.cashNetCents,
    couvertCents: totals.couvertCents,
    serviceFeeCents: totals.serviceFeeCents,
    deliveryFeeCents: totals.deliveryFeeCents,
  );

  await ref.read(cashShiftProvider.notifier).recordSale(record);
  final CashShift? after = ref.read(cashShiftProvider);
  SaleRecord saved = record;
  if (after != null) {
    for (final SaleRecord s in after.sales) {
      if (s.id == record.id) {
        saved = s;
        break;
      }
    }
  }
  ref.read(lastCompletedSaleProvider.notifier).state = saved;

  ref
      .read(catalogProvider.notifier)
      .applySoldQuantities(soldQuantitiesFromCart(lines));
  unawaited(ref.read(catalogProvider.notifier).refresh());

  return saved;
}
