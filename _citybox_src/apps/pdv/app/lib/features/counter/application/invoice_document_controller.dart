import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/brazilian_masks.dart';
import 'package:citybox_pdv/features/counter/application/counter_document_type_controller.dart';

/// Dígitos do CPF/CNPJ na nota (sem máscara).
///
/// Separado do tipo ([counterDocumentTypeProvider]): o operador pode trocar
/// CPF↔CNPJ e o valor digitado é limpo no toggle da UI, não aqui.
final NotifierProvider<InvoiceDocumentController, String>
invoiceDocumentProvider =
    NotifierProvider<InvoiceDocumentController, String>(
      InvoiceDocumentController.new,
    );

class InvoiceDocumentController extends Notifier<String> {
  @override
  String build() => '';

  void setDigits(String raw, {required CounterDocumentType type}) {
    final String digits = digitsOnly(raw);
    final int max = type == CounterDocumentType.cpf ? 11 : 14;
    state = digits.length > max ? digits.substring(0, max) : digits;
  }

  /// Prefill a partir do documento do cliente selecionado.
  void applyCustomerDocument(String? document) {
    final String digits = digitsOnly(document ?? '');
    if (digits.isEmpty) {
      return;
    }
    if (digits.length == 14) {
      ref.read(counterDocumentTypeProvider.notifier).setCnpj();
      state = digits.substring(0, 14);
      return;
    }
    if (digits.length >= 11) {
      ref.read(counterDocumentTypeProvider.notifier).setCpf();
      state = digits.substring(0, 11);
      return;
    }
    state = digits;
  }

  void clear() => state = '';
}
