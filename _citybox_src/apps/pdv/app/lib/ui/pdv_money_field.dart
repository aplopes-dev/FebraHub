import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// Máscara de moeda enquanto se digita.
///
/// Aceita só dígitos e reescreve o campo inteiro como `R$ 1.234,56`, com o
/// cursor sempre no fim — é o comportamento de caixa registradora, em que os
/// centavos se preenchem primeiro. Deixar o cursor no meio de um texto que a
/// máscara reescreve a cada tecla só produziria salto de cursor.
class PdvCurrencyInputFormatter extends TextInputFormatter {
  const PdvCurrencyInputFormatter();

  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    final String masked = maskCurrencyInput(newValue.text);
    return TextEditingValue(
      text: masked,
      selection: TextSelection.collapsed(offset: masked.length),
    );
  }
}

/// Campo de dinheiro do PDV.
///
/// **Use este, e não `PdvFilledField` com um filtro de dígitos**, em qualquer
/// campo de valor: sem máscara, `50` é ambíguo — metade das telas do app já
/// leu isso como R$ 50,00 e a outra metade como R$ 0,50. Aqui o que aparece
/// na tela é exatamente o valor que será gravado.
///
/// O valor sai em **centavos** por [onChangedCents]; leia o controller só se
/// precisar do texto formatado.
class PdvMoneyField extends StatelessWidget {
  const PdvMoneyField({
    required this.label,
    required this.controller,
    this.onChangedCents,
    this.autofocus = false,
    this.enabled = true,
    this.helperText,
    this.errorText,
    this.onSubmitted,
    super.key,
  });

  final String label;
  final TextEditingController controller;

  /// Chamado a cada tecla com o valor já convertido.
  final ValueChanged<int>? onChangedCents;

  final bool autofocus;
  final bool enabled;
  final String? helperText;
  final String? errorText;
  final ValueChanged<String>? onSubmitted;

  /// Centavos do que está digitado agora.
  static int centsOf(TextEditingController controller) =>
      centsFromDigits(controller.text);

  @override
  Widget build(BuildContext context) {
    return PdvFilledField(
      label: label,
      controller: controller,
      autofocus: autofocus,
      enabled: enabled,
      helperText: helperText,
      errorText: errorText,
      onSubmitted: onSubmitted,
      hintText: formatCents(0),
      keyboardType: const TextInputType.numberWithOptions(decimal: false),
      inputFormatters: const <TextInputFormatter>[PdvCurrencyInputFormatter()],
      // Dígitos de mesma largura: sem isso o valor dança na horizontal a cada
      // tecla, porque a máscara reescreve o texto inteiro.
      style: PdvTypography.bodyLg.copyWith(
        color: PdvColors.textPrimary,
        fontFeatures: PdvTypography.tabular,
      ),
      onChanged:
          onChangedCents == null
              ? null
              : (String text) => onChangedCents!(centsFromDigits(text)),
    );
  }
}
