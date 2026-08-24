import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_document_type_controller.dart';
import 'package:citybox_pdv/features/counter/application/invoice_document_controller.dart';

void main() {
  ProviderContainer container() {
    final ProviderContainer c = ProviderContainer();
    addTearDown(c.dispose);
    return c;
  }

  test('applyCustomerDocument preenche CPF (11) e ajusta tipo', () {
    final ProviderContainer c = container();
    c
        .read(invoiceDocumentProvider.notifier)
        .applyCustomerDocument('529.982.247-25');

    expect(c.read(invoiceDocumentProvider), '52998224725');
    expect(c.read(counterDocumentTypeProvider), CounterDocumentType.cpf);
  });

  test('applyCustomerDocument preenche CNPJ (14) e ajusta tipo', () {
    final ProviderContainer c = container();
    c
        .read(invoiceDocumentProvider.notifier)
        .applyCustomerDocument('11.222.333/0001-81');

    expect(c.read(invoiceDocumentProvider), '11222333000181');
    expect(c.read(counterDocumentTypeProvider), CounterDocumentType.cnpj);
  });

  test('clear zera dígitos', () {
    final ProviderContainer c = container();
    c.read(invoiceDocumentProvider.notifier).setDigits(
      '52998224725',
      type: CounterDocumentType.cpf,
    );
    c.read(invoiceDocumentProvider.notifier).clear();
    expect(c.read(invoiceDocumentProvider), isEmpty);
  });
}
