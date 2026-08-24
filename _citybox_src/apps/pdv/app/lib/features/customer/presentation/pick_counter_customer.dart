import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/counter/application/invoice_document_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_picker_dialog.dart';

/// Abre o seletor de clientes e aplica a escolha em [counterCustomerProvider].
///
/// Fechar sem confirmar não mexe no que já estava selecionado.
Future<void> pickCounterCustomer(BuildContext context, WidgetRef ref) async {
  final CustomerSelection? selection = await showCustomerPickerDialog(
    context,
    selected: ref.read(counterCustomerProvider),
  );
  if (selection == null) {
    return;
  }

  final Customer? picked = selection.customer;
  final CounterCustomerController controller = ref.read(
    counterCustomerProvider.notifier,
  );
  if (picked == null) {
    controller.clear();
  } else {
    controller.setCustomer(picked);
    ref
        .read(invoiceDocumentProvider.notifier)
        .applyCustomerDocument(picked.document);
  }
}

/// Atalho tipado para `unawaited(pickCounterCustomer(...))` em `onPressed`.
VoidCallback onPickCounterCustomer(BuildContext context, WidgetRef ref) {
  return () => unawaited(pickCounterCustomer(context, ref));
}
