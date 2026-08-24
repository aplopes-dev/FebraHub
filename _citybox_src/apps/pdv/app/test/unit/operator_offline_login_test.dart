import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/operator_cache.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';

import '../helpers/fake_device_credential_store.dart';
import '../helpers/operator_fixture.dart';

/// "Agora" fixo — a validade do cache é medida contra ele.
final DateTime now = DateTime.utc(2026, 8, 6, 12);

const PdvApiException offline = PdvApiException(
  'Sem conexão com o servidor da loja.',
  isOffline: true,
);

const PdvApiException unauthorized = PdvApiException(
  'Código ou PIN incorreto',
  statusCode: 401,
);

void main() {
  late FakePosOperatorApi api;
  late FakeOperatorCacheStore store;

  ProviderContainer build() {
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        posOperatorApiProvider.overrideWithValue(api),
        operatorCacheStoreProvider.overrideWithValue(store),
        operatorClockProvider.overrideWithValue(() => now),
        deviceCredentialStoreProvider.overrideWithValue(
          FakeDeviceCredentialStore(pairedFixture),
        ),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  /// Cache válido: sincronizado há 1 h, vencendo em 47 h.
  OperatorCache validCache() => operatorCacheFixture(
    syncedAt: now.subtract(const Duration(hours: 1)),
    expiresAt: now.add(const Duration(hours: 47)),
  );

  setUp(() {
    api = FakePosOperatorApi();
    store = FakeOperatorCacheStore();
  });

  group('Login offline', () {
    test('sem rede e com cache válido, entra', () async {
      api.failure = offline;
      store = FakeOperatorCacheStore(validCache());
      final ProviderContainer container = build();

      final PosOperator operator = await container
          .read(operatorSessionProvider.notifier)
          .signIn(code: testOperator.code, pin: '1234');

      expect(operator.id, testOperator.id);
      expect(container.read(operatorSessionProvider)?.id, testOperator.id);
    });

    test('sem rede, PIN errado é recusado pelo hash de verdade', () async {
      api.failure = offline;
      store = FakeOperatorCacheStore(validCache());
      final ProviderContainer container = build();

      await expectLater(
        container
            .read(operatorSessionProvider.notifier)
            .signIn(code: testOperator.code, pin: '9999'),
        throwsA(isA<PdvApiException>()),
      );
      expect(container.read(operatorSessionProvider), isNull);
    });

    test('cache vencido recusa e manda sincronizar', () async {
      api.failure = offline;
      store = FakeOperatorCacheStore(
        operatorCacheFixture(
          syncedAt: now.subtract(const Duration(hours: 49)),
          expiresAt: now.subtract(const Duration(hours: 1)),
        ),
      );
      final ProviderContainer container = build();

      await expectLater(
        container
            .read(operatorSessionProvider.notifier)
            .signIn(code: testOperator.code, pin: '1234'),
        throwsA(
          isA<PdvApiException>().having(
            (PdvApiException e) => e.message,
            'message',
            contains('sincronizar'),
          ),
        ),
      );
    });

    test('sem rede e sem cache, diz o que fazer', () async {
      api.failure = offline;
      final ProviderContainer container = build();

      await expectLater(
        container
            .read(operatorSessionProvider.notifier)
            .signIn(code: testOperator.code, pin: '1234'),
        throwsA(
          isA<PdvApiException>().having(
            (PdvApiException e) => e.message,
            'message',
            contains('Conecte à rede'),
          ),
        ),
      );
    });

    test('código que não está no cache é recusado', () async {
      api.failure = offline;
      store = FakeOperatorCacheStore(validCache());
      final ProviderContainer container = build();

      await expectLater(
        container
            .read(operatorSessionProvider.notifier)
            .signIn(code: '77', pin: '1234'),
        throwsA(
          // Mesma mensagem de PIN errado: o caminho offline não pode revelar
          // quais códigos existem.
          isA<PdvApiException>().having(
            (PdvApiException e) => e.message,
            'message',
            'Código ou PIN incorreto',
          ),
        ),
      );
    });
  });

  group('AC-M4-4 — 401 nunca cai no cache', () {
    test('servidor online recusando não consulta o cache', () async {
      // Cache com PIN válido: se o controller consultasse, o login passaria —
      // e um operador desligado voltaria a entrar.
      store = FakeOperatorCacheStore(validCache());
      api.failure = unauthorized;
      final ProviderContainer container = build();

      await expectLater(
        container
            .read(operatorSessionProvider.notifier)
            .signIn(code: testOperator.code, pin: '1234'),
        throwsA(
          isA<PdvApiException>().having(
            (PdvApiException e) => e.statusCode,
            'statusCode',
            401,
          ),
        ),
      );
      expect(container.read(operatorSessionProvider), isNull);
    });

    test(
      'erro do servidor que não é de rede também não cai no cache',
      () async {
        store = FakeOperatorCacheStore(validCache());
        api.failure = const PdvApiException(
          'Operador bloqueado por tentativas.',
          statusCode: 423,
        );
        final ProviderContainer container = build();

        await expectLater(
          container
              .read(operatorSessionProvider.notifier)
              .signIn(code: testOperator.code, pin: '1234'),
          throwsA(
            isA<PdvApiException>().having(
              (PdvApiException e) => e.statusCode,
              'statusCode',
              423,
            ),
          ),
        );
      },
    );
  });

  group('Contador local persistido', () {
    test('erro incrementa e sobrevive ao restart', () async {
      api.failure = unauthorized;
      final ProviderContainer first = build();

      for (int i = 0; i < 2; i++) {
        await expectLater(
          first
              .read(operatorSessionProvider.notifier)
              .signIn(code: testOperator.code, pin: '0000'),
          throwsA(isA<PdvApiException>()),
        );
      }
      expect(
        first
            .read(operatorSessionProvider.notifier)
            .attemptsFor(testOperator.code),
        2,
      );

      // "Reiniciar o app": container novo, mesmo cofre.
      final ProviderContainer second = build();
      await second.read(operatorSessionProvider.notifier).hydrate();

      expect(
        second
            .read(operatorSessionProvider.notifier)
            .attemptsFor(testOperator.code),
        2,
      );
    });

    test('login bem-sucedido zera o contador daquele código', () async {
      api.failure = unauthorized;
      final ProviderContainer container = build();
      await expectLater(
        container
            .read(operatorSessionProvider.notifier)
            .signIn(code: testOperator.code, pin: '0000'),
        throwsA(isA<PdvApiException>()),
      );

      api.failure = null;
      await container
          .read(operatorSessionProvider.notifier)
          .signIn(code: testOperator.code, pin: api.acceptedPin);

      expect(
        container
            .read(operatorSessionProvider.notifier)
            .attemptsFor(testOperator.code),
        0,
      );
    });

    test('errar offline também conta', () async {
      api.failure = offline;
      store = FakeOperatorCacheStore(validCache());
      final ProviderContainer container = build();

      await expectLater(
        container
            .read(operatorSessionProvider.notifier)
            .signIn(code: testOperator.code, pin: '9999'),
        throwsA(isA<PdvApiException>()),
      );

      // Sem isto, um aparelho sem rede seria dez mil tentativas sem nada
      // contando — que é o cenário de quem levou o tablet embora.
      expect(
        container
            .read(operatorSessionProvider.notifier)
            .attemptsFor(testOperator.code),
        1,
      );
    });
  });

  group('Sincronização', () {
    test('login online renova o pacote offline', () async {
      api.syncPackage = validCache();
      final ProviderContainer container = build();
      await container.read(deviceCredentialProvider.notifier).hydrate();

      await container
          .read(operatorSessionProvider.notifier)
          .signIn(code: testOperator.code, pin: api.acceptedPin);
      // `sync` é disparado sem await — deixa o microtask rodar.
      await Future<void>.delayed(Duration.zero);

      expect(api.syncCalls, 1);
      expect(store.writes, 1);
    });

    test('terminal não pareado não sincroniza', () async {
      api.syncPackage = validCache();
      final ProviderContainer container = build();

      final bool ok =
          await container.read(operatorCacheProvider.notifier).sync();

      expect(ok, isFalse);
      expect(api.syncCalls, 0);
    });

    test('falha de rede na sincronização não apaga o cache anterior', () async {
      store = FakeOperatorCacheStore(validCache());
      api.failure = offline;
      final ProviderContainer container = build();
      await container.read(deviceCredentialProvider.notifier).hydrate();
      await container.read(operatorCacheProvider.notifier).hydrate();

      final bool ok =
          await container.read(operatorCacheProvider.notifier).sync();

      expect(ok, isFalse);
      expect(await store.read(), isNotNull);
      expect(container.read(operatorCacheProvider), isNotNull);
    });
  });
}
