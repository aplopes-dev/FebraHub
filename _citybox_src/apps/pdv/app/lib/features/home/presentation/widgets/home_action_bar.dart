import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';

/// Item da coluna de ações, à direita da tela inicial.
///
/// Faixa horizontal: ícone à esquerda, rótulo no meio, tecla à direita. A tecla
/// alinhada na borda cria uma coluna vertical de atalhos que o olho percorre de
/// uma vez — é o que faz o operador achar o "(S)" sem ler os rótulos.
class HomeActionBar extends StatelessWidget {
  const HomeActionBar({
    required this.action,
    required this.onPressed,
    super.key,
  });

  final HomeAction action;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '${action.label}, atalho ${action.shortcutLabel}',
      excludeSemantics: true,
      child: Material(
        color: action.color,
        child: InkWell(
          onTap: onPressed,
          hoverColor: action.hoverColor,
          splashColor: action.pressedColor,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: PdvSpacing.lg,
              vertical: PdvSpacing.md,
            ),
            child: Row(
              children: <Widget>[
                Icon(
                  action.icon,
                  size: PdvSizes.iconLg,
                  color: PdvColors.onBrand,
                ),
                const SizedBox(width: PdvSpacing.lg),
                Expanded(
                  child: Text(
                    action.label.toUpperCase(),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: PdvTypography.label.copyWith(
                      color: PdvColors.onBrand,
                      letterSpacing: 0.4,
                    ),
                  ),
                ),
                Text(
                  '(${action.shortcutLabel})',
                  style: PdvTypography.label.copyWith(color: PdvColors.onBrand),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
