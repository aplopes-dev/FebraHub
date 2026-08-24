/// Uma categoria de produtos do Balcão.
///
/// "Todos os produtos" não é uma entrada aqui — é a ausência de seleção em
/// `counterCategoryProvider`. Modelar como categoria duplicaria a mesma
/// decisão em dois lugares (o catálogo e o provider).
class CounterCategory {
  const CounterCategory({required this.id, required this.label});

  final String id;
  final String label;
}
