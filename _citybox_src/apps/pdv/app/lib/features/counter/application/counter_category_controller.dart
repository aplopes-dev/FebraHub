import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Categoria selecionada no filtro de produtos do Balcão.
///
/// `null` é "Todos os produtos" — o padrão.
final NotifierProvider<CounterCategoryController, String?>
counterCategoryProvider = NotifierProvider<CounterCategoryController, String?>(
  CounterCategoryController.new,
);

class CounterCategoryController extends Notifier<String?> {
  @override
  String? build() => null;

  void select(String? categoryId) => state = categoryId;
}
