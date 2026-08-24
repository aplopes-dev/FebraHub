import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_movement_page.dart';
import 'package:citybox_pdv/features/cash/presentation/widgets/cash_movement_history.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';

import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('Sangria / reforço na home abre a tela de movimento', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.home,
      withOpenShift: true,
    );

    expect(find.byType(HomePage), findsOneWidget);
    await tester.tap(find.text('SANGRIA / REFORÇO'));
    await tester.pumpAndSettle();

    expect(find.byType(CashMovementPage), findsOneWidget);
    // Duas colunas: lançar à esquerda, conferir à direita.
    expect(find.text('SANGRIA'), findsOneWidget);
    expect(find.text('REFORÇO'), findsOneWidget);
    expect(find.text('CONFIRMAR SANGRIA'), findsOneWidget);
    expect(find.byType(CashMovementHistory), findsOneWidget);
    // Nome do PDV na barra, ao lado do Voltar.
    expect(find.text('Caixa 1'), findsOneWidget);
  });

  testWidgets('trocar para Reforço muda o botão e as operações', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.cashMovement,
      withOpenShift: true,
    );

    expect(find.text('Retirada do caixa'), findsOneWidget);

    await tester.tap(find.text('REFORÇO'));
    await tester.pumpAndSettle();

    expect(find.text('CONFIRMAR REFORÇO'), findsOneWidget);
    // A operação de sangria não existe do lado do reforço: sem o ajuste em
    // `_selectType`, o Dropdown ficaria com valor fora das opções e lançaria.
    expect(find.text('Retirada do caixa'), findsNothing);
    expect(find.text('Suprimento de troco'), findsOneWidget);
  });
}
