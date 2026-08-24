import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Onde a ação aparece na tela inicial.
enum HomeActionPlacement {
  /// Grade de blocos grandes, à esquerda. São as ações que abrem uma venda.
  grid,

  /// Coluna de ações, à direita. Apoio à operação do turno.
  rail,
}

/// Sub-coluna da grade que a ação ocupa.
///
/// Só tem sentido para [HomeActionPlacement.grid] — ações da coluna lateral
/// não usam isto. A grade é dividida em duas sub-colunas de largura fixa:
/// [primary] é a mais larga, com as ações que o caixa mais usa; [secondary] é
/// a mais estreita, com o resto.
enum HomeGridColumn {
  /// Sub-coluna 1.1 — mais larga: Balcão, Mesas, Comandas.
  primary,

  /// Sub-coluna 1.2 — mais estreita: as demais ações da grade.
  secondary,
}

/// Uma ação da tela inicial.
///
/// O catálogo inteiro vive em `home_actions.dart` como uma lista — a tela só
/// desenha o que está lá. Assim, incluir uma ação nova é acrescentar um item,
/// não mexer em layout; e a tecla de atalho, a cor e o rótulo ficam juntos, no
/// mesmo lugar, sem chance de divergirem.
class HomeAction {
  const HomeAction({
    required this.id,
    required this.label,
    required this.icon,
    required this.color,
    required this.placement,
    required this.shortcut,
    required this.shortcutLabel,
    this.subtitle,
    this.gridColumn,
  });

  /// Identificador estável, usado em testes e telemetria.
  final String id;

  final String label;

  /// Informação de contexto que a ação já resolve — o cliente selecionado, o
  /// vendedor do turno. Só a grade usa.
  final String? subtitle;

  final IconData icon;
  final Color color;
  final HomeActionPlacement placement;

  /// Sub-coluna da grade (`primary`/`secondary`). `null` para ações da
  /// coluna lateral ([HomeActionPlacement.rail]), que não têm sub-colunas.
  final HomeGridColumn? gridColumn;

  /// A tecla que dispara a ação.
  final LogicalKeyboardKey shortcut;

  /// Como a tecla é exibida no bloco: `B`, `F8`, `Ç`.
  ///
  /// É separado de [shortcut] porque nem todo rótulo bate com o nome técnico da
  /// tecla — e o operador aprende pelo rótulo, não pelo `LogicalKeyboardKey`.
  final String shortcutLabel;

  /// Cópia com outro [subtitle] — usado na home para o vendedor da venda.
  HomeAction withSubtitle(String? subtitle) {
    return HomeAction(
      id: id,
      label: label,
      subtitle: subtitle,
      icon: icon,
      color: color,
      placement: placement,
      gridColumn: gridColumn,
      shortcut: shortcut,
      shortcutLabel: shortcutLabel,
    );
  }
}

/// Tons de apoio derivados da cor da ação.
extension HomeActionPalette on HomeAction {
  /// Fundo do bloco quando o ponteiro está sobre ele.
  Color get hoverColor =>
      Color.alphaBlend(PdvColors.shade.withValues(alpha: 0.16), color);

  /// Fundo do bloco enquanto pressionado.
  Color get pressedColor =>
      Color.alphaBlend(PdvColors.shade.withValues(alpha: 0.28), color);
}
