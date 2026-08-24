import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Texto digitado na busca da barra de ferramentas do Balcão.
///
/// Filtra a grade de produtos por nome — ver `CounterProductGrid`. Comparação
/// sem diferenciar maiúsculas/minúsculas e por "contém", não por igualdade:
/// o operador não vai digitar o nome inteiro do produto.
final NotifierProvider<CounterSearchController, String> counterSearchProvider =
    NotifierProvider<CounterSearchController, String>(
      CounterSearchController.new,
    );

class CounterSearchController extends Notifier<String> {
  @override
  String build() => '';

  void setQuery(String query) => state = query;
}
