import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Botão preenchido de altura total da app bar.
///
/// Diferente de [PdvAppBarButton] (transparente, hover): este tem fundo cheio
/// — o caso de **Salvar e selecionar** em verde, que precisa saltar na barra.
class PdvAppBarFilledButton extends StatelessWidget {
  const PdvAppBarFilledButton({
    required this.label,
    required this.onPressed,
    this.backgroundColor = PdvColors.brand,
    this.foregroundColor = PdvColors.textOverlay,
    this.horizontalPadding = PdvSpacing.lg,
    super.key,
  });

  final String label;
  final VoidCallback onPressed;
  final Color backgroundColor;
  final Color foregroundColor;
  final double horizontalPadding;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: PdvSizes.appBarHeight,
      child: Material(
        color: backgroundColor,
        child: InkWell(
          onTap: onPressed,
          hoverColor: PdvColors.shade.withValues(alpha: 0.12),
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
            child: Center(
              child: Text(
                label.toUpperCase(),
                style: PdvTypography.label.copyWith(color: foregroundColor),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
