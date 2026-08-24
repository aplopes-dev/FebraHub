import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Tipo de documento lançado na nota — CPF ou CNPJ.
enum CounterDocumentType { cpf, cnpj }

final NotifierProvider<CounterDocumentTypeController, CounterDocumentType>
counterDocumentTypeProvider =
    NotifierProvider<CounterDocumentTypeController, CounterDocumentType>(
      CounterDocumentTypeController.new,
    );

class CounterDocumentTypeController extends Notifier<CounterDocumentType> {
  @override
  CounterDocumentType build() => CounterDocumentType.cpf;

  void toggle() {
    state =
        state == CounterDocumentType.cpf
            ? CounterDocumentType.cnpj
            : CounterDocumentType.cpf;
  }

  void setCpf() => state = CounterDocumentType.cpf;

  void setCnpj() => state = CounterDocumentType.cnpj;

  void reset() => state = CounterDocumentType.cpf;
}
