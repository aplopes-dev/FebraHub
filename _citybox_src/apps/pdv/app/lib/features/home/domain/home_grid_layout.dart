import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';

/// As duas sub-colunas da grade da tela inicial, já resolvidas.
typedef HomeGridLayout =
    ({List<HomeAction> primary, List<HomeAction> secondary});

/// Decide o que vai em cada sub-coluna.
///
/// Com `useHomeFavorites` desligado vale o catálogo (`action.gridColumn`) — a
/// posição de cada bloco é memória muscular, e um terminal que nunca foi
/// personalizado não pode mudar de layout sozinho.
///
/// Com ele ligado, valem as posições escolhidas em Configurações → Favoritos:
/// as três primeiras vão para a coluna 1, as três últimas para a coluna 2, na
/// ordem em que aparecem lá. Ação escondida por módulo é ignorada mesmo se
/// estiver escolhida — o favorito não sobrepõe o que o ERP desligou.
HomeGridLayout resolveHomeGrid({
  required List<HomeAction> visible,
  required TerminalSettings settings,
}) {
  if (!settings.useHomeFavorites) {
    return (
      primary:
          visible
              .where(
                (HomeAction a) =>
                    a.placement == HomeActionPlacement.grid &&
                    a.gridColumn == HomeGridColumn.primary,
              )
              .toList(),
      secondary:
          visible
              .where(
                (HomeAction a) =>
                    a.placement == HomeActionPlacement.grid &&
                    a.gridColumn == HomeGridColumn.secondary,
              )
              .toList(),
    );
  }

  List<HomeAction> pick(int from, int to) {
    final List<HomeAction> picked = <HomeAction>[];
    for (int i = from; i < to; i++) {
      final String? id = settings.homeFavorites[i];
      if (id == null) continue;
      for (final HomeAction action in visible) {
        if (action.id == id) {
          picked.add(action);
          break;
        }
      }
    }
    return picked;
  }

  final int half = homeFavoriteSlots ~/ 2;
  return (primary: pick(0, half), secondary: pick(half, homeFavoriteSlots));
}

/// Ações que sobram para a coluna lateral.
///
/// Com favoritos ligados, a coluna passa a ser "tudo que não está na grade" —
/// senão uma ação promovida a favorita apareceria duas vezes na tela.
List<HomeAction> resolveHomeRail({
  required List<HomeAction> visible,
  required TerminalSettings settings,
  required HomeGridLayout grid,
}) {
  if (!settings.useHomeFavorites) {
    return visible
        .where((HomeAction a) => a.placement == HomeActionPlacement.rail)
        .toList();
  }
  final Set<String> inGrid = <String>{
    for (final HomeAction a in grid.primary) a.id,
    for (final HomeAction a in grid.secondary) a.id,
  };
  return visible.where((HomeAction a) => !inGrid.contains(a.id)).toList();
}
