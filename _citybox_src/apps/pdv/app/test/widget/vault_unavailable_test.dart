import 'package:flutter/material.dart';
import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/storage/secure_store_failure.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/data/secure_operator_cache_store.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/policies/data/secure_pos_policy_store.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/shared/presentation/starting_page.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/terminal/data/secure_device_credential_store.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';
import 'package:citybox_pdv/features/terminal/presentation/activate_terminal_page.dart';

import '../helpers/fake_device_credential_store.dart';
import '../helpers/operator_fixture.dart';

/// Reproduz a falha real relatada em Linux sem chaveiro:
/// `PlatformException(Libsecret error, secret_service_get_sync: The name
/// org.freedesktop.secrets was not provided by any .service files)`.
///
/// Intercepta o canal de plataforma do `flutter_secure_storage`, e não a nossa
/// classe: o que se quer provar é que **as nossas** stores absorvem o erro do
/// plugin. Um fake que lançasse a exceção testaria o fake.
void installBrokenVault() {
  debugResetVaultGate();
  const MethodChannel channel = MethodChannel(
    'plugins.it_nomads.com/flutter_secure_storage',
  );
  TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
      .setMockMethodCallHandler(channel, (MethodCall call) async {
        throw PlatformException(
          code: 'Libsecret error',
          message:
              'secret_service_get_sync: The name org.freedesktop.secrets was '
              'not provided by any .service files',
        );
      });
  addTearDown(() {
    debugResetVaultGate();
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, null);
  });
}

void main() {
  setUpAll(() => initializeDateFormatting('pt_BR'));

  group('Stores absorvem o cofre indisponível', () {
    const FlutterSecureStorage storage = FlutterSecureStorage();

    testWidgets('ler a credencial devolve nulo em vez de explodir', (
      WidgetTester tester,
    ) async {
      installBrokenVault();

      expect(await const SecureDeviceCredentialStore(storage).read(), isNull);
    });

    testWidgets('ler a alçada devolve nulo', (WidgetTester tester) async {
      installBrokenVault();

      expect(await const SecurePosPolicyStore(storage).read(), isNull);
    });

    testWidgets('ler o cache e o contador devolve vazio', (
      WidgetTester tester,
    ) async {
      installBrokenVault();
      const SecureOperatorCacheStore store = SecureOperatorCacheStore(storage);

      expect(await store.read(), isNull);
      expect(await store.readAttempts(), isEmpty);
    });

    testWidgets('gravar a credencial **falha alto**', (
      WidgetTester tester,
    ) async {
      installBrokenVault();

      // Único caminho que não pode ser silencioso: o código de pareamento é de
      // uso único, e um "ativado" que não persiste queima o código por nada.
      await expectLater(
        const SecureDeviceCredentialStore(storage).write(pairedFixture),
        throwsA(isA<SecureStoreUnavailableException>()),
      );
    });

    testWidgets('gravar alçada, cache e contador é silencioso', (
      WidgetTester tester,
    ) async {
      installBrokenVault();
      const SecureOperatorCacheStore cacheStore = SecureOperatorCacheStore(
        storage,
      );

      // Não lançam: são caminhos de fundo, e a consequência já aparece em
      // outro lugar (alçada rebuscada a cada boot; sem cache, a barra de
      // título avisa que não há entrada sem rede).
      await const SecurePosPolicyStore(storage).write(const PosPolicy());
      await cacheStore.writeAttempts(<String, int>{'01': 2});
      await cacheStore.write(
        operatorCacheFixture(
          syncedAt: DateTime.utc(2026, 8, 6),
          expiresAt: DateTime.utc(2026, 8, 8),
        ),
      );
    });
  });

  group('Cofre que **não responde** (diálogo de desbloqueio pendente)', () {
    const FlutterSecureStorage storage = FlutterSecureStorage();

    /// Canal que nunca responde — o que um `gcr-prompter` aberto produz.
    ///
    /// ⚠️ Distinto de cofre ausente: **não lança nada**, só nunca volta. Foi o
    /// que travou o PDV num WSL cujo chaveiro tinha senha e cujo diálogo de
    /// desbloqueio nem chegava a desenhar.
    void installHangingVault() {
      debugResetVaultGate();
      const MethodChannel channel = MethodChannel(
        'plugins.it_nomads.com/flutter_secure_storage',
      );
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
            channel,
            (MethodCall call) => Completer<Object?>().future,
          );
      addTearDown(() {
        debugResetVaultGate();
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
            .setMockMethodCallHandler(channel, null);
      });
    }

    testWidgets('ler desiste depois do timeout em vez de esperar para sempre', (
      WidgetTester tester,
    ) async {
      installHangingVault();

      await tester.runAsync(() async {
        final Stopwatch clock = Stopwatch()..start();
        final DeviceCredential? result =
            await const SecureDeviceCredentialStore(storage).read();
        clock.stop();

        expect(result, isNull);
        expect(
          clock.elapsed,
          lessThan(vaultTimeout + const Duration(seconds: 3)),
        );
      });
    });

    testWidgets('gravar a credencial falha alto, não pendura', (
      WidgetTester tester,
    ) async {
      installHangingVault();

      await tester.runAsync(() async {
        await expectLater(
          const SecureDeviceCredentialStore(storage).write(pairedFixture),
          throwsA(isA<SecureStoreUnavailableException>()),
        );
      });
    });

    testWidgets('o boot sai da tela de abertura mesmo assim', (
      WidgetTester tester,
    ) async {
      installHangingVault();

      final ProviderContainer container = ProviderContainer();
      addTearDown(container.dispose);

      await tester.runAsync(() async {
        await container.read(deviceCredentialProvider.notifier).hydrate();
      });

      // A trava do bug relatado: sem timeout, este sinal nunca chegava e o PDV
      // ficava carregando para sempre.
      expect(container.read(deviceCredentialHydratedProvider), isTrue);
    });
  });

  group('O app não fica preso na tela de abertura', () {
    testWidgets('cofre quebrado ainda leva à ativação', (
      WidgetTester tester,
    ) async {
      installBrokenVault();
      tester.view.physicalSize = const Size(1400, 900);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.reset);

      late ProviderContainer container;
      await tester.pumpWidget(
        ProviderScope(
          overrides: <Override>[
            showCustomTitleBarProvider.overrideWithValue(false),
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

      // Sem cofre, as stores reais são usadas e o canal levanta
      // `PlatformException` — exatamente o cenário relatado.
      await container.read(deviceCredentialProvider.notifier).hydrate();
      await tester.pumpAndSettle();

      // ⚠️ A trava do bug: `markHydrated` está no `finally`. Sem ele, este
      // sinal nunca chega e o PDV fica carregando para sempre, sem mensagem.
      expect(container.read(deviceCredentialHydratedProvider), isTrue);
      expect(find.byType(StartingPage), findsNothing);
      expect(find.byType(ActivateTerminalPage), findsOneWidget);
    });

    testWidgets('hidratar alçada, cache e contador não lança', (
      WidgetTester tester,
    ) async {
      installBrokenVault();

      final ProviderContainer container = ProviderContainer(
        overrides: <Override>[
          deviceCredentialStoreProvider.overrideWithValue(
            FakeDeviceCredentialStore(pairedFixture),
          ),
        ],
      );
      addTearDown(container.dispose);

      await container.read(operatorSessionProvider.notifier).hydrate();
      await container.read(operatorCacheProvider.notifier).hydrate();

      expect(
        container.read(operatorSessionProvider.notifier).attemptsFor('01'),
        0,
      );
      expect(container.read(operatorCacheProvider), isNull);
    });

    testWidgets('sem cofre, a alçada fica na restritiva', (
      WidgetTester tester,
    ) async {
      installBrokenVault();

      final ProviderContainer container = ProviderContainer(
        overrides: <Override>[
          deviceCredentialStoreProvider.overrideWithValue(
            FakeDeviceCredentialStore(null),
          ),
        ],
      );
      addTearDown(container.dispose);

      await container.read(posPolicyProvider.notifier).hydrate();

      // Erra para o lado de exigir mais, nunca menos.
      final PosPolicy policy = container.read(posPolicyProvider);
      expect(policy.cancellationRequiresSupervisor, isTrue);
      expect(policy.discountSupervisorAbovePercent, 10);
    });
  });

  group('Pareamento confere o cofre antes de queimar o código', () {
    /// Cliente com adaptador falso e **baseUrl inexistente de propósito**: se
    /// alguma requisição escapar do adaptador, o teste falha em vez de tentar
    /// alcançar um servidor de verdade.
    ({PdvApiClient client, FakeHttpAdapter adapter}) fakeClient(
      (int, Map<String, Object?>) Function(RequestOptions) responder,
    ) {
      final PdvApiClient client = PdvApiClient(
        baseUrl: 'http://fake.local/api',
      );
      final FakeHttpAdapter adapter = FakeHttpAdapter(responder);
      client.dio.httpClientAdapter = adapter;
      return (client: client, adapter: adapter);
    }

    test('cofre que não grava impede o resgate', () async {
      final FakeDeviceCredentialStore store =
          FakeDeviceCredentialStore()..writable = false;
      final ({PdvApiClient client, FakeHttpAdapter adapter}) fake = fakeClient(
        (RequestOptions options) => (200, <String, Object?>{}),
      );

      final ProviderContainer container = ProviderContainer(
        overrides: <Override>[
          deviceCredentialStoreProvider.overrideWithValue(store),
          pdvApiClientProvider.overrideWithValue(fake.client),
        ],
      );
      addTearDown(container.dispose);

      await expectLater(
        container
            .read(deviceCredentialProvider.notifier)
            .pair(code: 'AJ44BAKZ', deviceLabel: 'Linux'),
        throwsA(isA<SecureStoreUnavailableException>()),
      );

      // ⚠️ O ponto do teste. O código é de **uso único**: resgatar e só então
      // descobrir que o cofre não grava deixaria o terminal marcado como
      // pareado no ERP, o PDV sem credencial e o código queimado — foi o que
      // aconteceu em WSL2.
      expect(fake.adapter.lastRequest, isNull);
      expect(store.writes, 0);
      expect(container.read(deviceCredentialProvider), isNull);
    });

    test('a mensagem diz que o código continua valendo', () {
      // Sem isso o gerente gera código atrás de código achando que o problema
      // é o código.
      expect(
        SecureStoreUnavailableException.message,
        contains('código continua válido'),
      );
      expect(
        SecureStoreUnavailableException.message,
        contains('suporte técnico'),
      );
    });

    test('cofre saudável não atrapalha o pareamento', () async {
      final FakeDeviceCredentialStore store = FakeDeviceCredentialStore();
      final ({PdvApiClient client, FakeHttpAdapter adapter}) fake = fakeClient(
        (RequestOptions options) => (
          200,
          <String, Object?>{
            'data': <String, Object?>{
              'deviceToken': 'token-novo',
              'terminal': <String, Object?>{
                'id': 'terminal-1',
                'name': 'Caixa 1 — Balcão',
                'organizationId': 'org-1',
                'branchId': 'branch-1',
              },
            },
          },
        ),
      );

      final ProviderContainer container = ProviderContainer(
        overrides: <Override>[
          deviceCredentialStoreProvider.overrideWithValue(store),
          pdvApiClientProvider.overrideWithValue(fake.client),
        ],
      );
      addTearDown(container.dispose);

      final DeviceCredential credential = await container
          .read(deviceCredentialProvider.notifier)
          .pair(code: 'AJ44BAKZ', deviceLabel: 'Linux');

      expect(credential.terminalName, 'Caixa 1 — Balcão');
      expect(store.writes, 1);
    });
  });
}
