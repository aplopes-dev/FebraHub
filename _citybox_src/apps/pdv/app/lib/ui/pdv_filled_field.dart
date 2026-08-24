import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Decoração **Filled** canônica do PDV: `filled: true` + `inputFill` +
/// **underline**.
///
/// É o filled do Material, não o outlined: o fundo preenchido já desenha a
/// caixa do campo, e o traço fica só embaixo. Contorno fechado em volta de um
/// campo preenchido vira retângulo dentro de retângulo.
InputDecoration pdvFilledDecoration({
  required String label,
  String? hintText,
  String? helperText,
  Widget? suffixIcon,
  String? errorText,
}) {
  return InputDecoration(
    labelText: label,
    hintText: hintText,
    helperText: helperText,
    errorText: errorText,
    // O padrão do Material é **uma linha com reticências**, e mensagem de erro
    // cortada é pior que erro nenhum: o operador vê que algo falhou e não
    // descobre o quê. Três linhas cobrem as mensagens longas que a API e o
    // cofre produzem.
    errorMaxLines: 3,
    helperMaxLines: 2,
    suffixIcon: suffixIcon,
    filled: true,
    fillColor: PdvColors.inputFill,
    contentPadding: const EdgeInsets.symmetric(
      horizontal: PdvSpacing.lg,
      vertical: PdvSpacing.lg,
    ),
    border: _underlineBorder(PdvColors.border),
    enabledBorder: _underlineBorder(PdvColors.border),
    focusedBorder: _underlineBorder(
      PdvColors.focusRing,
      width: PdvSizes.borderWidthFocus,
    ),
    errorBorder: _underlineBorder(PdvColors.danger),
    focusedErrorBorder: _underlineBorder(
      PdvColors.danger,
      width: PdvSizes.borderWidthFocus,
    ),
    disabledBorder: _underlineBorder(PdvColors.border),
  );
}

UnderlineInputBorder _underlineBorder(
  Color color, {
  double width = PdvSizes.borderWidth,
}) {
  return UnderlineInputBorder(
    borderRadius: PdvRadius.baseAll,
    borderSide: BorderSide(color: color, width: width),
  );
}

/// Campo de texto Filled padronizado.
class PdvFilledField extends StatelessWidget {
  const PdvFilledField({
    required this.label,
    required this.controller,
    this.keyboardType,
    this.maxLines = 1,
    this.enabled = true,
    this.inputFormatters,
    this.hintText,
    this.onSubmitted,
    this.onChanged,
    this.focusNode,
    this.autofocus = false,
    this.helperText,
    this.errorText,
    this.suffixIcon,
    this.style,
    super.key,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final int maxLines;
  final bool enabled;
  final List<TextInputFormatter>? inputFormatters;
  final String? hintText;
  final ValueChanged<String>? onSubmitted;
  final ValueChanged<String>? onChanged;
  final FocusNode? focusNode;
  final bool autofocus;
  final String? helperText;

  /// Não-nulo pinta a borda de erro e mostra a mensagem no lugar de
  /// [helperText].
  final String? errorText;

  final Widget? suffixIcon;

  /// Sobrepõe o estilo do texto digitado. Usado por `PdvMoneyField`, que
  /// precisa de dígitos de mesma largura.
  final TextStyle? style;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      autofocus: autofocus,
      enabled: enabled,
      keyboardType: keyboardType,
      maxLines: maxLines,
      inputFormatters: inputFormatters,
      onSubmitted: onSubmitted,
      onChanged: onChanged,
      style:
          style ?? PdvTypography.bodyMd.copyWith(color: PdvColors.textPrimary),
      decoration: pdvFilledDecoration(
        label: label,
        hintText: hintText,
        helperText: helperText,
        errorText: errorText,
        suffixIcon: suffixIcon,
      ),
    );
  }
}
