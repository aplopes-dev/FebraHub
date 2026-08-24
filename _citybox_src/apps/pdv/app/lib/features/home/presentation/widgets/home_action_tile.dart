import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';

/// Bloco grande da grade da tela inicial.
///
/// Ícone dominante, rótulo, tecla e um subtítulo opcional. O alvo é a **área
/// inteira** — num caixa, mirar num botão pequeno dentro de um cartão é tempo
/// perdido e erro de toque.
class HomeActionTile extends StatelessWidget {
  const HomeActionTile({
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
            padding: const EdgeInsets.all(PdvSpacing.lg),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Icon(action.icon, size: 56, color: PdvColors.onBrand),
                const SizedBox(height: PdvSpacing.md),
                Text(
                  action.label.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: PdvTypography.headingSm.copyWith(
                    color: PdvColors.onBrand,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: PdvSpacing.xs),
                Text(
                  '(${action.shortcutLabel})',
                  style: PdvTypography.labelSm.copyWith(
                    color: PdvColors.onBrand,
                  ),
                ),
                if (action.subtitle != null) ...<Widget>[
                  const SizedBox(height: PdvSpacing.sm),
                  Text(
                    action.subtitle!.toUpperCase(),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: PdvTypography.caption.copyWith(
                      // Branco a 80% em vez de um cinza fixo: o subtítulo tem
                      // de recuar sobre qualquer uma das cores de ação, e um
                      // cinza só funcionaria em algumas delas.
                      color: PdvColors.onBrand.withValues(alpha: 0.8),
                      letterSpacing: 0.3,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
