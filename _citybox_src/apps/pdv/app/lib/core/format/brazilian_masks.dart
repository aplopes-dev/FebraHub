import 'package:flutter/services.dart';

/// Mantém só dígitos — o que o domínio e a API futura esperam.
String digitsOnly(String value) => value.replaceAll(RegExp(r'\D'), '');

/// Aplica um padrão em que `#` é slot de dígito (ex.: `###.###.###-##`).
String applyDigitMask(String digits, String pattern) {
  final StringBuffer buffer = StringBuffer();
  int digitIndex = 0;

  for (int i = 0; i < pattern.length && digitIndex < digits.length; i++) {
    final String slot = pattern[i];
    if (slot == '#') {
      buffer.write(digits[digitIndex]);
      digitIndex += 1;
    } else {
      buffer.write(slot);
    }
  }

  return buffer.toString();
}

String _clipDigits(String raw, int max) {
  final String digits = digitsOnly(raw);
  return digits.length > max ? digits.substring(0, max) : digits;
}

String formatCpf(String raw) =>
    applyDigitMask(_clipDigits(raw, 11), '###.###.###-##');

String formatCnpj(String raw) =>
    applyDigitMask(_clipDigits(raw, 14), '##.###.###/####-##');

String formatCpfOrCnpj(String raw, {required bool isCpf}) =>
    isCpf ? formatCpf(raw) : formatCnpj(raw);

/// Telefone BR: `(##) ####-####` (10) ou `(##) #####-####` (11).
String formatPhone(String raw) {
  final String clipped = _clipDigits(raw, 11);
  if (clipped.length <= 10) {
    return applyDigitMask(clipped, '(##) ####-####');
  }
  return applyDigitMask(clipped, '(##) #####-####');
}

String formatCep(String raw) =>
    applyDigitMask(_clipDigits(raw, 8), '#####-###');

/// Data de nascimento na UI: `dd/MM/yyyy`.
String formatBirthDate(String raw) =>
    applyDigitMask(_clipDigits(raw, 8), '##/##/####');

/// Converte dígitos `ddMMyyyy` (ou texto mascarado) para ISO `yyyy-mm-dd`.
/// Retorna `null` se incompleto ou data inválida.
String? birthDateDigitsToIso(String raw) {
  final String digits = _clipDigits(raw, 8);
  if (digits.length != 8) return null;
  final int day = int.parse(digits.substring(0, 2));
  final int month = int.parse(digits.substring(2, 4));
  final int year = int.parse(digits.substring(4, 8));
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    return null;
  }
  final DateTime? parsed = DateTime.tryParse(
    '$year-${month.toString().padLeft(2, '0')}-${day.toString().padLeft(2, '0')}',
  );
  if (parsed == null ||
      parsed.year != year ||
      parsed.month != month ||
      parsed.day != day) {
    return null;
  }
  return '${parsed.year.toString().padLeft(4, '0')}-'
      '${parsed.month.toString().padLeft(2, '0')}-'
      '${parsed.day.toString().padLeft(2, '0')}';
}

/// ISO `yyyy-mm-dd` → máscara `dd/MM/yyyy` para o campo.
String birthDateIsoToDisplay(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  final Match? match = RegExp(r'^(\d{4})-(\d{2})-(\d{2})').firstMatch(iso);
  if (match == null) return formatBirthDate(iso);
  return '${match[3]}/${match[2]}/${match[1]}';
}

/// Formatter de máscara por padrão (`#` = dígito).
class DigitMaskFormatter extends TextInputFormatter {
  DigitMaskFormatter(this.pattern);

  /// Ex.: `###.###.###-##`, `(##) #####-####`, `#####-###`.
  final String pattern;

  int get _maxDigits =>
      pattern.split('').where((String char) => char == '#').length;

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final String clipped = _clipDigits(newValue.text, _maxDigits);
    final String formatted = applyDigitMask(clipped, pattern);

    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

/// Telefone com máscara adaptativa (10 ou 11 dígitos).
class PhoneMaskFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final String formatted = formatPhone(newValue.text);
    return TextEditingValue(
      text: formatted,
      selection: TextSelection.collapsed(offset: formatted.length),
    );
  }
}

final TextInputFormatter cpfMaskFormatter = DigitMaskFormatter(
  '###.###.###-##',
);
final TextInputFormatter cnpjMaskFormatter = DigitMaskFormatter(
  '##.###.###/####-##',
);
final TextInputFormatter cepMaskFormatter = DigitMaskFormatter('#####-###');
final TextInputFormatter birthDateMaskFormatter = DigitMaskFormatter(
  '##/##/####',
);
final TextInputFormatter phoneMaskFormatter = PhoneMaskFormatter();
