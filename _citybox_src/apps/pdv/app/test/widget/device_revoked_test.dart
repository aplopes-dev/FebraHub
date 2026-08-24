import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/presentation/activate_terminal_page.dart';

import '../helpers/fake_device_credential_store.dart';
import '../helpers/operator_fixture.dart';
import '../helpers/policy_fixture.dart';

/// Resposta do `DeviceAuthGuard` quando o terminal foi revogado no ERP.
///
/// O `code` é o contrato: o texto pode ser reescrito a qualquer momento, e o
/// app **não** pode depender dele para decidir desparear.
const Map<String, Object?> revokedBody = <String, Object?>{
  'error': <String, Object?>{
    'code': 'PosTerminalDeviceUnauthorizedError',
    'message': 'Terminal não autorizado',
  },
};

/// 401 de **PIN de operador** — mesmo status, reação oposta.
const Map<String, Object?> wrongPinBody = <String, Object?>{
  'error': <String, Object?>{
    'code': 'PosOperatorCredentialsUnauthorizedError',
    'message': 'Código ou PIN incorreto',
  },
};

({PdvApiClient client, FakeHttpAdapter adapter}) fakeClient(
  (int, Map<String, Object?>) Function(RequestOptions) responder,
) {
  final PdvApiClient client = PdvApiClient(baseUrl: 'http://fake.local/api');
  final FakeHttpAdapter adapter = FakeHttpAdapter(responder);
  client.dio.httpClientAdapter = adapter;
  return (client: client, adapter: adapter);
}

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));

  group('PdvApiException.code', () {
    test('lê o code do envelope da API', () {
      final PdvApiException error = PdvApiException.from(
        DioException(
          requestOptions: RequestOptions(path: '/v1/pos/operators'),
          response: Response<Map<String, Object?>>(
            requestOptions: RequestOptions(path: '/v1/pos/operators'),
            statusCode: 401,
            data: revokedBody,
          ),
        ),
      );

      expect(error.isDeviceUnauthorized, isTrue);
      expect(error.statusCode, 401);
      expect(error.message, 'Terminal não autorizado');
    });

    test('PIN errado é 401 mas **não** é credencial de dispositivo', () {
      final PdvApiException error = PdvApiException.from(
        DioException(
          requestOptions: RequestOptions(
            path: '/v1/pos/operators/authenticate',
          ),
          response: Response<Map<String, Object?>>(
            requestOptions: RequestOptions(
              path: '/v1/pos/operators/authenticate',
            ),
            statusCode: 401,
            data: wrongPinBody,
          ),
        ),
      );

      // ⚠️ Se isto virasse `true`, errar o PIN despareria o terminal e o
      // operador teria que chamar o gerente por causa de um dedo escorregado.
      expect(error.isDeviceUnauthorized, isFalse);
      expect(error.isUnauthorized, isTrue);
    });
  });

  group('Revogação despareia o terminal', () {
    late ProviderContainer container;
    late FakeDeviceCredentialStore store;

    ProviderContainer build(
      (int, Map<String, Object?>) Function(RequestOptions) responder,
    ) {
      store = FakeDeviceCredentialStore(pairedFixture);
      final ProviderContainer c = ProviderContainer(
        overrides: <Override>[
          deviceCredentialStoreProvider.overrideWithValue(store),
          operatorCacheStoreProvider.overrideWithValue(
            FakeOperatorCacheStore(),
          ),
          posPolicyStoreProvider.overrideWithValue(FakePosPolicyStore()),
          pdvApiClientProvider.overrideWithValue(fakeClient(responder).client),
        ],
      );
      addTearDown(c.dispose);
      return c;
    }

    test('qualquer rota que receba o code despareia', () async {
      container = build((RequestOptions options) => (401, revokedBody));
      await container.read(deviceCredentialProvider.notifier).hydrate();
      expect(container.read(deviceCredentialProvider), isNotNull);

      // A lista de operadores é o caminho mais comum: o terminal está parado
      // na tela de login quando o gerente revoga.
      await expectLater(
        container.read(posOperatorApiProvider).list(),
        throwsA(isA<PdvApiException>()),
      );
      await Future<void>.delayed(Duration.zero);

      expect(container.read(deviceCredentialProvider), isNull);
      expect(container.read(deviceRevokedProvider), isTrue);
      expect(await store.read(), isNull);
    });

    test('PIN errado **não** despareia', () async {
      container = build((RequestOptions options) => (401, wrongPinBody));
      await container.read(deviceCredentialProvider.notifier).hydrate();

      await expectLater(
        container
            .read(operatorSessionProvider.notifier)
            .signIn(code: '01', pin: '0000'),
        throwsA(isA<PdvApiException>()),
      );
      await Future<void>.delayed(Duration.zero);

      // O terminal continua pareado, e o contador de tentativas subiu — que é
      // a reação correta a um PIN errado.
      expect(container.read(deviceCredentialProvider), isNotNull);
      expect(container.read(deviceRevokedProvider), isFalse);
      expect(
        container.read(operatorSessionProvider.notifier).attemptsFor('01'),
        1,
      );
    });

    test('a sessão do operador cai junto', () async {
      container = build((RequestOptions options) => (401, revokedBody));
      await container.read(deviceCredentialProvider.notifier).hydrate();
      // Planta a sessão sem passar pela API, que aqui só sabe recusar.
      container.read(operatorSessionProvider.notifier);
      await container
          .read(posOperatorApiProvider)
          .list()
          .catchError((Object _) => <PosOperator>[]);
      await Future<void>.delayed(Duration.zero);

      // Terminal revogado não pode deixar alguém logado numa loja que já não é
      // a dele — o gate de turno o manteria dentro do app.
      expect(container.read(operatorSessionProvider), isNull);
    });

    test('despareia uma vez só, mesmo com várias rotas falhando', () async {
      container = build((RequestOptions options) => (401, revokedBody));
      await container.read(deviceCredentialProvider.notifier).hydrate();

      // Revogação costuma ser descoberta por três requisições ao mesmo tempo
      // (lista, alçada, sync). Sem a guarda de idempotência, seriam três
      // limpezas e três reavaliações de rota para o mesmo fato.
      await Future.wait<void>(<Future<void>>[
        container
            .read(posOperatorApiProvider)
            .list()
            .catchError((Object _) => <PosOperator>[]),
        container
            .read(posOperatorApiProvider)
            .list()
            .catchError((Object _) => <PosOperator>[]),
        container
            .read(posOperatorApiProvider)
            .list()
            .catchError((Object _) => <PosOperator>[]),
      ]);
      await Future<void>.delayed(Duration.zero);

      expect(container.read(deviceCredentialProvider), isNull);
      expect(store.clears, 1);
    });
  });

  group('A tela de ativação explica o desligamento', () {
    testWidgets('mostra o aviso quando foi revogado', (
      WidgetTester tester,
    ) async {
      tester.view.physicalSize = const Size(1400, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      late ProviderContainer container;
      await tester.pumpWidget(
        ProviderScope(
          overrides: <Override>[
            showCustomTitleBarProvider.overrideWithValue(false),
            deviceCredentialStoreProvider.overrideWithValue(
              FakeDeviceCredentialStore(),
            ),
            operatorCacheStoreProvider.overrideWithValue(
              FakeOperatorCacheStore(),
            ),
            posPolicyStoreProvider.overrideWithValue(FakePosPolicyStore()),
            posOperatorApiProvider.overrideWithValue(FakePosOperatorApi()),
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
      // Terminal novo não tem nada a explicar.
      expect(find.textContaining('encerrado pelo gerente'), findsNothing);

      container.read(deviceRevokedProvider.notifier).markRevoked();
      await tester.pumpAndSettle();

      // Depois de revogado, sim: o operador estava trabalhando e a tela mudou
      // sozinha.
      expect(find.textContaining('encerrado pelo gerente'), findsOneWidget);
      expect(find.textContaining('código de ativação novo'), findsOneWidget);
    });
  });
}
