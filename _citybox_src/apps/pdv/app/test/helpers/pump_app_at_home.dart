import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/main.dart';

import 'catalog_fixture.dart';
import 'fake_device_credential_store.dart';
import 'fake_pos_cash_session_api.dart';
import 'operator_fixture.dart';
import 'policy_fixture.dart';

/// Monta o **`PdvApp` de verdade** e o leva até a Home pelo caminho real.
///
/// Existe porque a Home deixou de ser alcançável por acidente. Enquanto a
/// `initialLocation` era `/`, montar o app já entregava a Home — sem
/// credencial, sem operador e sem passar por guard nenhum. As suítes que
/// testam a Home dependiam disso sem saber; quando a tela de abertura entrou
/// (§4.11.1 do AGENTS.md), elas pararam de encontrar a tela.
///
/// Aqui o app percorre os três estágios como em produção: hidrata a credencial
/// (cofre falso, já pareado), entra com código + PIN contra a API falsa e só
/// então chega à Home. Mais lento que plantar estado, e é o ponto — o que se
/// quer provar sobre a Home vale para a Home que o operador realmente vê.
Future<ProviderContainer> pumpAppAtHome(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
}) async {
  SharedPreferences.setMockInitialValues(<String, Object>{});

  final FakePosOperatorApi operatorApi = FakePosOperatorApi();

  await tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[
        // A barra de título fala com o gerenciador de janelas, que não existe
        // em teste de widget.
        showCustomTitleBarProvider.overrideWithValue(false),
        // Os três cofres e as duas APIs: sem isto o boot morre em
        // `MissingPluginException` ou tenta rede de verdade.
        deviceCredentialStoreProvider.overrideWithValue(
          FakeDeviceCredentialStore(pairedFixture),
        ),
        operatorCacheStoreProvider.overrideWithValue(FakeOperatorCacheStore()),
        posPolicyStoreProvider.overrideWithValue(FakePosPolicyStore()),
        posOperatorApiProvider.overrideWithValue(operatorApi),
        posPolicyApiProvider.overrideWithValue(FakePosPolicyApi()),
        posCashSessionApiProvider.overrideWithValue(FakePosCashSessionApi()),
        ...fixtureCatalogOverrides(),
        ...overrides,
      ],
      child: const PdvApp(),
    ),
  );

  // O `PdvApp` dispara as hidratações no primeiro frame; até elas voltarem, o
  // app fica na tela de abertura.
  await tester.pumpAndSettle();

  final ProviderContainer container = ProviderScope.containerOf(
    tester.element(find.byType(PdvApp)),
  );

  await container
      .read(operatorSessionProvider.notifier)
      .signIn(code: testOperator.code, pin: operatorApi.acceptedPin);
  await tester.pumpAndSettle();

  // Falha alto e cedo: sem isto, uma regressão no boot viraria uma cascata de
  // "widget não encontrado" em cada teste, longe da causa.
  expect(
    find.byType(HomePage),
    findsOneWidget,
    reason:
        'O app deveria estar na Home depois de hidratar e entrar. '
        'Se falhou aqui, o problema é o boot, não o que o teste ia provar.',
  );

  return container;
}
