import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/presentation/operator_login_page.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/shared/presentation/starting_page.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/presentation/activate_terminal_page.dart';

import '../helpers/fake_device_credential_store.dart';
import '../helpers/operator_fixture.dart';
import '../helpers/policy_fixture.dart';

/// Monta o **router real** — não o harness de `pumpWithRouter`.
///
/// É proposital: o que este arquivo cobre é a `initialLocation` e a ordem dos
/// guards de `createPdvRouter`, e um harness com redirect próprio poderia
/// passar mesmo com o router de produção errado. Foi exatamente esse o bug.
Future<ProviderContainer> pumpRealRouter(
  WidgetTester tester, {
  required bool paired,
}) async {
  late ProviderContainer container;

  // A superfície padrão do `flutter_test` é 800×600 — abaixo do mínimo real da
  // janela (1024×640). Sem isto a Home estoura o layout e o teste falharia por
  // um tamanho que o app nunca usa.
  tester.view.physicalSize = const Size(1400, 900);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[
        showCustomTitleBarProvider.overrideWithValue(false),
        deviceCredentialStoreProvider.overrideWithValue(
          FakeDeviceCredentialStore(paired ? pairedFixture : null),
        ),
        posOperatorApiProvider.overrideWithValue(FakePosOperatorApi()),
        operatorCacheStoreProvider.overrideWithValue(FakeOperatorCacheStore()),
        posPolicyStoreProvider.overrideWithValue(FakePosPolicyStore()),
      ],
      child: Consumer(
        builder: (BuildContext context, WidgetRef ref, _) {
          container = ProviderScope.containerOf(context);
          return MaterialApp.router(
            theme: PdvTheme.data(),
            routerConfig: ref.watch(pdvRouterProvider),
          );
        },
      ),
    ),
  );

  return container;
}

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));

  testWidgets('o primeiro frame não é a Home', (WidgetTester tester) async {
    final ProviderContainer container = await pumpRealRouter(
      tester,
      paired: true,
    );

    // ⚠️ A trava do bug. Antes daqui a `initialLocation` era a Home, e o
    // redirect devolvia `null` enquanto o cofre não tinha sido lido — então o
    // PDV desenhava a tela operacional, com os blocos de venda, antes de saber
    // quem estava no caixa.
    expect(
      container.read(pdvRouterProvider).state.matchedLocation,
      PdvRoutes.starting,
    );
    expect(find.byType(StartingPage), findsOneWidget);
    expect(find.byType(HomePage), findsNothing);
  });

  testWidgets('a tela de abertura não oferece ação nenhuma', (
    WidgetTester tester,
  ) async {
    await pumpRealRouter(tester, paired: true);

    // O intervalo é de milissegundos: qualquer botão seria convite a tocar em
    // algo que desaparece debaixo do dedo.
    expect(find.byType(ElevatedButton), findsNothing);
    expect(find.byType(FilledButton), findsNothing);
    expect(find.byType(TextButton), findsNothing);
    expect(find.byType(BackButton), findsNothing);
  });

  testWidgets('terminal pareado sai da abertura para o login', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpRealRouter(
      tester,
      paired: true,
    );

    await container.read(deviceCredentialProvider.notifier).hydrate();
    await tester.pumpAndSettle();

    // Sessão de operador não é persistida: abrir o app é sempre entrar de novo.
    expect(find.byType(OperatorLoginPage), findsOneWidget);
    expect(find.byType(StartingPage), findsNothing);
  });

  testWidgets('terminal não pareado sai da abertura para a ativação', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpRealRouter(
      tester,
      paired: false,
    );

    await container.read(deviceCredentialProvider.notifier).hydrate();
    await tester.pumpAndSettle();

    expect(find.byType(ActivateTerminalPage), findsOneWidget);
    expect(find.byType(StartingPage), findsNothing);
  });

  testWidgets('com operador logado, a abertura leva à Home', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpRealRouter(
      tester,
      paired: true,
    );

    await container.read(deviceCredentialProvider.notifier).hydrate();
    await container
        .read(operatorSessionProvider.notifier)
        .signIn(code: testOperator.code, pin: '1234');
    await tester.pumpAndSettle();

    expect(
      container.read(pdvRouterProvider).state.matchedLocation,
      PdvRoutes.home,
    );
  });

  testWidgets('a abertura não é alcançável depois do boot', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await pumpRealRouter(
      tester,
      paired: true,
    );
    await container.read(deviceCredentialProvider.notifier).hydrate();
    await container
        .read(operatorSessionProvider.notifier)
        .signIn(code: testOperator.code, pin: '1234');
    await tester.pumpAndSettle();

    // Navegar para lá à mão devolve a Home: a tela existe para o boot, não é
    // um lugar onde o operador possa ficar preso.
    container.read(pdvRouterProvider).go(PdvRoutes.starting);
    await tester.pumpAndSettle();

    expect(find.byType(StartingPage), findsNothing);
    expect(
      container.read(pdvRouterProvider).state.matchedLocation,
      PdvRoutes.home,
    );
  });
}
