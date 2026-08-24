import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Quantos dígitos tem o PIN. Espelha `POS_OPERATOR_PIN_LENGTH` da `erp-api`.
const int posOperatorPinLength = 4;

/// Teclado numérico do PIN.
///
/// Teclado próprio, e não campo de texto: num terminal de balcão não há teclado
/// físico à mão, e o teclado virtual do sistema cobre meia tela — justamente a
/// metade onde está a lista de operadores.
class OperatorPinPad extends StatelessWidget {
  const OperatorPinPad({
    required this.value,
    required this.onChanged,
    required this.onSubmit,
    this.enabled = true,
    super.key,
  });

  final String value;
  final ValueChanged<String> onChanged;
  final VoidCallback onSubmit;
  final bool enabled;

  void _press(String digit) {
    if (value.length >= posOperatorPinLength) return;
    final String next = '$value$digit';
    onChanged(next);
    // Confirma sozinho no último dígito: um "OK" a mais por login, dezenas de
    // vezes por dia, é atrito que não compra nada.
    if (next.length == posOperatorPinLength) onSubmit();
  }

  void _backspace() {
    if (value.isEmpty) return;
    onChanged(value.substring(0, value.length - 1));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _PinDots(filled: value.length),
        const SizedBox(height: PdvSpacing.xl),
        for (final List<String> row in const <List<String>>[
          <String>['1', '2', '3'],
          <String>['4', '5', '6'],
          <String>['7', '8', '9'],
        ])
          Padding(
            padding: const EdgeInsets.only(bottom: PdvSpacing.md),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                for (final String digit in row)
                  _PadKey(
                    label: digit,
                    onPressed: enabled ? () => _press(digit) : null,
                  ),
              ],
            ),
          ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const SizedBox(width: _keySize + PdvSpacing.md),
            _PadKey(label: '0', onPressed: enabled ? () => _press('0') : null),
            _PadKey(
              icon: Icons.backspace_outlined,
              semanticLabel: 'Apagar',
              onPressed: enabled ? _backspace : null,
            ),
          ],
        ),
      ],
    );
  }
}

/// Tamanho da tecla. Bem acima do mínimo de 44 px: o PIN é digitado às pressas
/// e errar a tecla custa uma tentativa do bloqueio.
const double _keySize = 72;

class _PinDots extends StatelessWidget {
  const _PinDots({required this.filled});

  final int filled;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        for (int i = 0; i < posOperatorPinLength; i++)
          Container(
            width: PdvSpacing.lg,
            height: PdvSpacing.lg,
            margin: const EdgeInsets.symmetric(horizontal: PdvSpacing.sm),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: i < filled ? PdvColors.info : Colors.transparent,
              border: Border.all(
                color: i < filled ? PdvColors.info : PdvColors.borderStrong,
                width: PdvSizes.borderWidthFocus,
              ),
            ),
          ),
      ],
    );
  }
}

class _PadKey extends StatelessWidget {
  const _PadKey({
    this.label,
    this.icon,
    this.semanticLabel,
    required this.onPressed,
  }) : assert(
         label != null || icon != null,
         'Uma tecla precisa de rótulo ou de ícone.',
       );

  final String? label;
  final IconData? icon;
  final String? semanticLabel;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final String? text = label;

    return Padding(
      padding: const EdgeInsets.only(right: PdvSpacing.md),
      child: SizedBox(
        width: _keySize,
        height: _keySize,
        child: Semantics(
          button: true,
          label: semanticLabel ?? text,
          child: Material(
            color: PdvColors.surface,
            child: InkWell(
              onTap: onPressed,
              child: Center(
                child:
                    text != null
                        ? Text(
                          text,
                          style: PdvTypography.headingMd.copyWith(
                            color:
                                onPressed == null
                                    ? PdvColors.textDisabled
                                    : PdvColors.textPrimary,
                          ),
                        )
                        : Icon(
                          icon,
                          size: PdvSizes.iconLg,
                          color:
                              onPressed == null
                                  ? PdvColors.textDisabled
                                  : PdvColors.textPrimary,
                        ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
