import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/home/data/home_actions.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/home/domain/home_grid_layout.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/settings/domain/terminal_settings.dart';

List<String> _ids(List<HomeAction> actions) =>
    actions.map((HomeAction a) => a.id).toList();

void main() {
  final List<HomeAction> all = homeActions.toList();

  group('sem favoritos', () {
    const TerminalSettings settings = TerminalSettings();

    test('a grade vem do catálogo, não dos favoritos gravados', () {
      final HomeGridLayout grid = resolveHomeGrid(
        visible: all,
        settings: settings.copyWith(
          homeFavorites: <String?>[null, null, null, null, null, null],
        ),
      );
      // Favoritos vazios não esvaziam a grade quando a opção está desligada:
      // a posição de cada bloco é memória muscular.
      expect(grid.primary, isNotEmpty);
      expect(grid.secondary, isNotEmpty);
    });

    test('a coluna lateral são as ações de rail', () {
      final HomeGridLayout grid = resolveHomeGrid(
        visible: all,
        settings: settings,
      );
      final List<HomeAction> rail = resolveHomeRail(
        visible: all,
        settings: settings,
        grid: grid,
      );
      expect(
        rail.every((HomeAction a) => a.placement == HomeActionPlacement.rail),
        isTrue,
      );
    });
  });

  group('com favoritos', () {
    const TerminalSettings settings = TerminalSettings(
      useHomeFavorites: true,
      homeFavorites: <String?>[
        PdvModuleIds.deliveryOrders,
        null,
        PdvModuleIds.counter,
        PdvModuleIds.history,
        PdvModuleIds.customer,
        null,
      ],
    );

    test('as três primeiras posições viram a coluna 1', () {
      final HomeGridLayout grid = resolveHomeGrid(
        visible: all,
        settings: settings,
      );
      expect(_ids(grid.primary), <String>[
        PdvModuleIds.deliveryOrders,
        PdvModuleIds.counter,
      ]);
      expect(_ids(grid.secondary), <String>[
        PdvModuleIds.history,
        PdvModuleIds.customer,
      ]);
    });

    test('posição vazia é respeitada, não preenchida sozinha', () {
      final HomeGridLayout grid = resolveHomeGrid(
        visible: all,
        settings: settings,
      );
      expect(grid.primary.length, 2);
      expect(grid.secondary.length, 2);
    });

    test('ação escondida pelo ERP não entra, mesmo sendo favorita', () {
      // O favorito não sobrepõe o que o módulo desligou — senão a tela abriria
      // um caminho que o ERP fechou.
      final List<HomeAction> visible =
          all.where((HomeAction a) => a.id != PdvModuleIds.counter).toList();
      final HomeGridLayout grid = resolveHomeGrid(
        visible: visible,
        settings: settings,
      );
      expect(_ids(grid.primary), isNot(contains(PdvModuleIds.counter)));
    });

    test('o que está na grade não se repete na coluna lateral', () {
      final HomeGridLayout grid = resolveHomeGrid(
        visible: all,
        settings: settings,
      );
      final List<HomeAction> rail = resolveHomeRail(
        visible: all,
        settings: settings,
        grid: grid,
      );
      // Pedidos delivery é ação de rail promovida a favorita: sem o filtro,
      // apareceria nos dois lugares ao mesmo tempo.
      expect(_ids(rail), isNot(contains(PdvModuleIds.deliveryOrders)));
      expect(_ids(rail), isNot(contains(PdvModuleIds.counter)));
    });
  });

  group('favoritos gravados fora do formato', () {
    test('lista curta é completada com posições vazias', () {
      final TerminalSettings restored = TerminalSettings.fromJson(
        const TerminalSettings().toJson()
          ..['homeFavorites'] = <String>[PdvModuleIds.counter],
      );
      expect(restored.homeFavorites.length, homeFavoriteSlots);
      expect(restored.homeFavorites.first, PdvModuleIds.counter);
      expect(restored.homeFavorites.last, isNull);
    });

    test('lista longa é cortada', () {
      final TerminalSettings restored = TerminalSettings.fromJson(
        const TerminalSettings().toJson()
          ..['homeFavorites'] = List<String>.filled(20, PdvModuleIds.counter),
      );
      expect(restored.homeFavorites.length, homeFavoriteSlots);
    });

    test('campo ausente cai no padrão', () {
      final Map<String, Object?> json =
          const TerminalSettings().toJson()..remove('homeFavorites');
      expect(
        TerminalSettings.fromJson(json).homeFavorites,
        defaultHomeFavorites,
      );
    });
  });
}
