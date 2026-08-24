import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/presentation/operator_login_page.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/presentation/activate_terminal_page.dart';

import '../helpers/fake_device_credential_store.dart';
import '../helpers/operator_fixture.dart';
import '../helpers/policy_fixture.dart';

(int, Map<String, Object?>) _pairedResponse(RequestOptions _) => (
  201,
  <String, Object?>{
    'data': <String, Object?>{
      'deviceToken': 'token-novo-em-folha',
      'terminal': <String, Object?>{
        'id': 'terminal-9',
        'name': 'Caixa 9',
        'organizationId': 'org-1',
        'branchId': 'branch-1',
      },
    },
  },
);

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));

  testWidgets('REPRO: parear um terminal recém-instalado termina em /login', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final PdvApiClient client = PdvApiClient(baseUrl: 'http://fake.local/api');
    final FakeHttpAdapter adapter = FakeHttpAdapter(_pairedResponse);
    client.dio.httpClientAdapter = adapter;

    late ProviderContainer container;
    await tester.pumpWidget(
      ProviderScope(
        overrides: <Override>[
          showCustomTitleBarProvider.overrideWithValue(false),
          deviceCredentialStoreProvider.overrideWithValue(
            FakeDeviceCredentialStore(),
          ),
          posOperatorApiProvider.overrideWithValue(FakePosOperatorApi()),
          operatorCacheStoreProvider.overrideWithValue(FakeOperatorCacheStore()),
          posPolicyStoreProvider.overrideWithValue(FakePosPolicyStore()),
          pdvApiClientProvider.overrideWithValue(client),
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

    await container.read(deviceCredentialProvider.notifier).hydrate();
    await tester.pumpAndSettle();
    expect(find.byType(ActivateTerminalPage), findsOneWidget);

    await tester.enterText(find.byType(TextField).first, 'abcd2345');
    await tester.tap(find.text('ATIVAR'));
    await tester.pumpAndSettle();

    final String location =
        container.read(pdvRouterProvider).state.matchedLocation;
    // eslint-disable-next-line no-console
    print('ROTA APOS PAREAR: $location');
    expect(
      location,
      PdvRoutes.operatorLogin,
      reason:
          'Após parear, sem operador logado, o app deve cair no login do '
          'operador, não na Home.',
    );
    expect(find.byType(HomePage), findsNothing);
    expect(find.byType(OperatorLoginPage), findsOneWidget);
  });
}
