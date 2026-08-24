import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/home/data/home_actions.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/home/presentation/widgets/home_action_tile.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';

import '../helpers/pump_app_at_home.dart';

/// Esconde ações direto pelo controller de módulos, uma de cada vez.
///
/// O que estas provas verificam é como a grade reage ao estado escondido, não
/// a UI de configuração — módulos vêm do ERP; ler/escrever o provider direto
/// isola o comportamento da Home.
Future<void> _hideActions(WidgetTester tester, List<String> labels) async {
  final ProviderContainer container = ProviderScope.containerOf(
    tester.element(find.byType(HomePage)),
  );

  for (final String label in labels) {
    final HomeAction action = homeActions.firstWhere(
      (HomeAction candidate) => candidate.label == label,
    );
    container
        .read(moduleVisibilityProvider.notifier)
        .setVisible(action.id, visible: false);
  }

  await tester.pump();
}

/// Tamanho do bloco da grade que exibe [upperLabel] (o rótulo já em
/// maiúsculas, como a tela renderiza). O `HomeActionTile` mais próximo acima
/// do texto tem o tamanho que o `Expanded`/`Row` da grade deu ao bloco.
Size _tileSize(WidgetTester tester, String upperLabel) {
  return tester.getSize(
    find.ancestor(
      of: find.text(upperLabel),
      matching: find.byType(HomeActionTile),
    ),
  );
}

Future<void> _pumpWide(WidgetTester tester) async {
  tester.view.physicalSize = const Size(1600, 1000);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);
  // Passa pelos guards de verdade — ver `pumpAppAtHome`.
  await pumpAppAtHome(tester);
}

void main() {
  testWidgets(
    'a sub-coluna principal (1.1) é mais larga que a secundária (1.2)',
    (WidgetTester tester) async {
      await _pumpWide(tester);

      // Balcão está na 1.1 (principal); Cliente está na 1.2 (secundária).
      final double primaryWidth = _tileSize(tester, 'BALCÃO').width;
      final double secondaryWidth = _tileSize(tester, 'CLIENTE').width;

      // A proporção é 3:2 (1,5×). A faixa 1.3–1.7 absorve o pixel do gap entre
      // as duas sub-colunas sem depender do valor exato dele.
      final double ratio = primaryWidth / secondaryWidth;
      expect(ratio, greaterThan(1.3));
      expect(ratio, lessThan(1.7));
    },
  );

  testWidgets(
    'esconder um item da coluna principal faz os outros dois crescerem',
    (WidgetTester tester) async {
      await _pumpWide(tester);

      final double baselineHeight = _tileSize(tester, 'BALCÃO').height;

      await _hideActions(tester, <String>['Mesas']);

      final double grownHeight = _tileSize(tester, 'BALCÃO').height;

      // De 1/3 para 1/2 da coluna — um crescimento real, não arredondamento.
      expect(grownHeight, greaterThan(baselineHeight * 1.3));
    },
  );

  testWidgets(
    'escondendo os outros dois da coluna principal, o restante ocupa tudo',
    (WidgetTester tester) async {
      await _pumpWide(tester);
      await _hideActions(tester, <String>['Mesas', 'Comandas']);

      final double soleHeight = _tileSize(tester, 'BALCÃO').height;
      // A coluna secundária continua com os 3 itens dela — cada um ainda vale
      // 1/3 da mesma altura total. O item sozinho na principal deve valer
      // perto dos 3 juntos.
      final double secondaryUnitHeight = _tileSize(tester, 'CLIENTE').height;

      expect(soleHeight, greaterThan(secondaryUnitHeight * 2.5));
    },
  );

  testWidgets(
    'núcleo na coluna secundária impede esconder Cliente e Vendedor',
    (WidgetTester tester) async {
      await _pumpWide(tester);

      final double splitWidth = _tileSize(tester, 'BALCÃO').width;

      // Cliente e Vendedor são ⬛ (FR-002) — setVisible é rejeitado.
      // Só Atendimentos (opcional) some; a coluna secundária permanece.
      await _hideActions(tester, <String>[
        'Cliente',
        'Atendimentos',
        'Vendedor',
      ]);

      expect(find.text('CLIENTE'), findsOneWidget);
      expect(find.text('VENDEDOR'), findsOneWidget);
      expect(find.text('ATENDIMENTOS'), findsNothing);

      final double afterWidth = _tileSize(tester, 'BALCÃO').width;
      expect(afterWidth, lessThan(splitWidth * 1.2));
    },
  );
}
