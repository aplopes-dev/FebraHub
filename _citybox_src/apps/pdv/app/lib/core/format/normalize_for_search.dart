/// Minúsculas e sem diacríticos, para comparar texto digitado.
///
/// Tabela manual em vez de `intl`/`diacritic`: são as letras acentuadas do
/// português, e a dependência ainda não entrou no projeto (ver regra 4.5 do
/// `AGENTS.md`). Se a busca passar a valer para outra língua, isso vira um
/// pacote — não mais uma linha nesta tabela.
String normalizeForSearch(String value) {
  final StringBuffer buffer = StringBuffer();
  for (final int rune in value.toLowerCase().runes) {
    final String char = String.fromCharCode(rune);
    buffer.write(_diacritics[char] ?? char);
  }
  return buffer.toString().trim();
}

/// Ordenação alfabética para listas do PDV (clientes, vendedores).
int compareNamesForSort(String a, String b) =>
    normalizeForSearch(a).compareTo(normalizeForSearch(b));

/// Cópia ordenada por nome (pt-BR, sem acento/caixa).
List<T> sortedByName<T>(List<T> items, String Function(T item) nameOf) {
  final List<T> next = List<T>.of(items);
  next.sort(
    (T a, T b) => compareNamesForSort(nameOf(a), nameOf(b)),
  );
  return next;
}

const Map<String, String> _diacritics = <String, String>{
  'á': 'a',
  'à': 'a',
  'ã': 'a',
  'â': 'a',
  'ä': 'a',
  'é': 'e',
  'è': 'e',
  'ê': 'e',
  'ë': 'e',
  'í': 'i',
  'ì': 'i',
  'î': 'i',
  'ï': 'i',
  'ó': 'o',
  'ò': 'o',
  'õ': 'o',
  'ô': 'o',
  'ö': 'o',
  'ú': 'u',
  'ù': 'u',
  'û': 'u',
  'ü': 'u',
  'ç': 'c',
  'ñ': 'n',
};
