import 'package:intl/intl.dart';

/// Formatador de valores monetários do PDV — real brasileiro, símbolo antes
/// do valor. Uma instância só, para nenhuma tela divergir na casa decimal ou
/// no símbolo.
final NumberFormat pdvCurrencyFormat = NumberFormat.currency(
  locale: 'pt_BR',
  symbol: 'R\$',
);

/// Formata centavos inteiros para exibição (domínio nunca usa `double`).
String formatCents(int cents) => pdvCurrencyFormat.format(cents / 100);

/// Só os dígitos de [raw], como centavos.
///
/// É a leitura de **caixa registradora**: o operador digita da direita para a
/// esquerda e os centavos se preenchem primeiro — `1` vira `R$ 0,01`, `1250`
/// vira `R$ 12,50`. Não existe ponto nem vírgula para acertar, então também
/// não existe o erro clássico de digitar `50` e lançar `R$ 5.000`.
int centsFromDigits(String raw) {
  final String digits = raw.replaceAll(RegExp(r'[^\d]'), '');
  if (digits.isEmpty) return 0;
  // Corta o excesso à esquerda: 16 dígitos já passam de R$ 900 trilhões, e
  // sem o teto um dedo preso na tecla estoura o `int`.
  final String capped =
      digits.length > 16 ? digits.substring(digits.length - 16) : digits;
  return int.parse(capped);
}

/// Texto mascarado de um campo de dinheiro a partir dos dígitos digitados.
///
/// Vazio continua vazio: mostrar `R$ 0,00` num campo intocado esconde do
/// operador que ele ainda não digitou nada.
String maskCurrencyInput(String raw) {
  if (raw.replaceAll(RegExp(r'[^\d]'), '').isEmpty) return '';
  return formatCents(centsFromDigits(raw));
}
