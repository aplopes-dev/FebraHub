import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_menu_drawer.dart';
import 'package:citybox_pdv/features/home/data/home_actions.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/sales_history/presentation/sales_history_page.dart';

import '../helpers/pump_with_router.dart';

Future<void> _openMenu(WidgetTester tester) async {
  await tester.tap(find.byIcon(Icons.menu));
  await tester.pumpAndSettle();
}

void main() {
  testWidgets('botão de menu da barra padrão abre o menu lateral', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );

    expect(find.byType(PdvMenuDrawer), findsNothing);
    await _openMenu(tester);
    expect(find.byType(PdvMenuDrawer), findsOneWidget);
  });

  testWidgets('menu lista as ações da Home, com o atalho ao lado', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );
    await _openMenu(tester);

    // O menu sai do mesmo catálogo da Home: uma lista própria aqui divergiria
    // no primeiro item novo.
    //
    // Rola até cada item: o rodapé de sessão (Bloquear / Trocar operador)
    // encurtou a lista, e o que está fora da viewport nem chega a ser
    // construído — `findsNothing` ali seria falso negativo.
    for (final HomeAction action in homeActions) {
      final Finder item = find.descendant(
        of: find.byType(PdvMenuDrawer),
        matching: find.text(action.label),
      );
      if (item.evaluate().isEmpty) {
        await tester.scrollUntilVisible(
          item,
          200,
          scrollable: find.descendant(
            of: find.byType(PdvMenuDrawer),
            matching: find.byType(Scrollable),
          ),
        );
      }
      expect(item, findsOneWidget, reason: 'ação ${action.id} sumiu do menu');
      expect(
        find.descendant(
          of: find.byType(PdvMenuDrawer),
          matching: find.text('(${action.shortcutLabel})'),
        ),
        findsWidgets,
        reason: 'atalho de ${action.id}',
      );
    }
  });

  testWidgets('tocar num item fecha o menu e navega', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );
    await _openMenu(tester);

    await tester.tap(
      find.descendant(
        of: find.byType(PdvMenuDrawer),
        matching: find.text('Últimas vendas'),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(SalesHistoryPage), findsOneWidget);
    // Sem o `pop` antes de navegar, o menu ficaria aberto atrás da rota nova
    // e reapareceria no Voltar.
    expect(find.byType(PdvMenuDrawer), findsNothing);
  });

  testWidgets('tela com app bar própria não tem menu lateral', (
    WidgetTester tester,
  ) async {
    // Balcão e Pagamento substituem a barra inteira: ali o operador está
    // dentro de uma venda, e um menu de navegação convidaria a abandoná-la.
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.salesHistory,
      withOpenShift: true,
    );
    await tester.pumpAndSettle();

    expect(find.byIcon(Icons.menu), findsNothing);
    expect(find.byType(Drawer), findsNothing);
  });
}
