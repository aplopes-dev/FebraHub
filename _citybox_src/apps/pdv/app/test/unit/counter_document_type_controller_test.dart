import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_document_type_controller.dart';

void main() {
  test('começa em CPF', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    expect(
      container.read(counterDocumentTypeProvider),
      CounterDocumentType.cpf,
    );
  });

  test('toggle alterna entre CPF e CNPJ e volta', () {
    final ProviderContainer container = ProviderContainer();
    addTearDown(container.dispose);

    final CounterDocumentTypeController controller = container.read(
      counterDocumentTypeProvider.notifier,
    );

    controller.toggle();
    expect(
      container.read(counterDocumentTypeProvider),
      CounterDocumentType.cnpj,
    );

    controller.toggle();
    expect(
      container.read(counterDocumentTypeProvider),
      CounterDocumentType.cpf,
    );
  });
}
