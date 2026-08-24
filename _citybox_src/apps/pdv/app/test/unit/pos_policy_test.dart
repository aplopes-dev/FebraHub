import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';

import '../helpers/fake_device_credential_store.dart';
import '../helpers/policy_fixture.dart';

void main() {
  group('PosPolicy — decisão de exigir supervisor', () {
    const PosPolicy policy = PosPolicy(
      discountSupervisorAbovePercent: 10,
      withdrawalSupervisorAboveCents: 50000,
    );

    test('desconto abaixo do limite não pede supervisor', () {
      expect(
        policy.requiresSupervisor(PosOperation.discount, amount: 5),
        false,
      );
    });

    test('desconto exatamente no limite não pede supervisor', () {
      // O campo diz "sem supervisor **até** 10%". Pedir gerente no valor que a
      // tela apresenta como permitido é o tipo de divergência que vira chamado.
      expect(
        policy.requiresSupervisor(PosOperation.discount, amount: 10),
        false,
      );
    });

    test('desconto acima do limite pede supervisor', () {
      expect(
        policy.requiresSupervisor(PosOperation.discount, amount: 10.5),
        true,
      );
      expect(
        policy.requiresSupervisor(PosOperation.discount, amount: 20),
        true,
      );
    });

    test('sangria compara centavos, não reais', () {
      expect(
        policy.requiresSupervisor(PosOperation.withdrawal, amount: 50000),
        false,
      );
      expect(
        policy.requiresSupervisor(PosOperation.withdrawal, amount: 50001),
        true,
      );
    });

    test('cancelamento e devolução seguem o liga/desliga', () {
      expect(policy.requiresSupervisor(PosOperation.cancellation), true);
      expect(policy.requiresSupervisor(PosOperation.refund), true);

      const PosPolicy liberada = PosPolicy(
        cancellationRequiresSupervisor: false,
        refundRequiresSupervisor: false,
      );
      expect(liberada.requiresSupervisor(PosOperation.cancellation), false);
      expect(liberada.requiresSupervisor(PosOperation.refund), false);
    });

    test('100% de desconto configurado nunca exige supervisor', () {
      const PosPolicy semLimite = PosPolicy(
        discountSupervisorAbovePercent: 100,
      );
      expect(
        semLimite.requiresSupervisor(PosOperation.discount, amount: 100),
        false,
      );
    });

    test('sangria com limite zero sempre exige supervisor', () {
      const PosPolicy sempre = PosPolicy(withdrawalSupervisorAboveCents: 0);
      expect(
        sempre.requiresSupervisor(PosOperation.withdrawal, amount: 1),
        true,
      );
    });
  });

  group('PosPolicy.fromJson', () {
    test('lê a resposta da API', () {
      final PosPolicy policy = PosPolicy.fromJson(<String, dynamic>{
        'id': 'policy-1',
        'discountSupervisorAbovePercent': 25,
        'withdrawalSupervisorAboveCents': 100000,
        'cancellationRequiresSupervisor': false,
        'refundRequiresSupervisor': true,
        'updatedAt': '2026-08-06T12:00:00.000Z',
      });

      expect(policy.discountSupervisorAbovePercent, 25);
      expect(policy.withdrawalSupervisorAboveCents, 100000);
      expect(policy.cancellationRequiresSupervisor, false);
      expect(policy.updatedAt, isNotNull);
    });

    test('campo ausente cai no restritivo, não no permissivo', () {
      final PosPolicy policy = PosPolicy.fromJson(<String, dynamic>{});

      expect(policy.discountSupervisorAbovePercent, 10);
      expect(policy.cancellationRequiresSupervisor, true);
      expect(policy.refundRequiresSupervisor, true);
    });

    test('sobrevive a ida e volta pelo cache', () {
      const PosPolicy original = PosPolicy(
        discountSupervisorAbovePercent: 30,
        withdrawalSupervisorAboveCents: 12345,
        cancellationRequiresSupervisor: false,
      );

      final PosPolicy roundTrip = PosPolicy.fromJson(original.toJson());

      expect(roundTrip.discountSupervisorAbovePercent, 30);
      expect(roundTrip.withdrawalSupervisorAboveCents, 12345);
      expect(roundTrip.cancellationRequiresSupervisor, false);
    });
  });

  group('PosPolicyController', () {
    late FakePosPolicyStore store;
    late FakePosPolicyApi api;
    late ProviderContainer container;

    ProviderContainer build({bool paired = true}) {
      final ProviderContainer c = ProviderContainer(
        overrides: <Override>[
          posPolicyStoreProvider.overrideWithValue(store),
          posPolicyApiProvider.overrideWithValue(api),
          deviceCredentialStoreProvider.overrideWithValue(
            FakeDeviceCredentialStore(paired ? pairedFixture : null),
          ),
        ],
      );
      addTearDown(c.dispose);
      return c;
    }

    setUp(() {
      store = FakePosPolicyStore();
      api = FakePosPolicyApi();
    });

    test('sem sincronizar, vale o restritivo', () {
      container = build();
      expect(
        container.read(posPolicyProvider).cancellationRequiresSupervisor,
        true,
      );
      expect(
        container.read(posPolicyProvider).discountSupervisorAbovePercent,
        10,
      );
    });

    test('hydrate publica o servidor e grava no cache', () async {
      api.policy = const PosPolicy(discountSupervisorAbovePercent: 30);
      container = build();
      await container.read(deviceCredentialProvider.notifier).hydrate();

      await container.read(posPolicyProvider.notifier).hydrate();

      expect(
        container.read(posPolicyProvider).discountSupervisorAbovePercent,
        30,
      );
      expect(store.writes, 1);
    });

    test('sem rede, o cache continua valendo', () async {
      store = FakePosPolicyStore(
        const PosPolicy(discountSupervisorAbovePercent: 40),
      );
      api.failure = const PdvApiException(
        'Sem conexão com o servidor da loja.',
      );
      container = build();
      await container.read(deviceCredentialProvider.notifier).hydrate();

      await container.read(posPolicyProvider.notifier).hydrate();

      // A falha de rede não pode zerar o que o terminal já sabia — nem para
      // mais restritivo, nem para mais frouxo.
      expect(
        container.read(posPolicyProvider).discountSupervisorAbovePercent,
        40,
      );
    });

    test('sem rede e sem cache, cai no restritivo', () async {
      api.failure = const PdvApiException(
        'Sem conexão com o servidor da loja.',
      );
      container = build();
      await container.read(deviceCredentialProvider.notifier).hydrate();

      await container.read(posPolicyProvider.notifier).hydrate();

      expect(
        container.read(posPolicyProvider).cancellationRequiresSupervisor,
        true,
      );
    });

    test('terminal não pareado não chama a API', () async {
      container = build(paired: false);
      await container.read(deviceCredentialProvider.notifier).hydrate();

      await container.read(posPolicyProvider.notifier).hydrate();

      expect(api.currentCalls, 0);
    });

    test('desativar o terminal apaga a alçada da loja anterior', () async {
      api.policy = const PosPolicy(discountSupervisorAbovePercent: 90);
      container = build();
      await container.read(deviceCredentialProvider.notifier).hydrate();
      await container.read(posPolicyProvider.notifier).hydrate();
      expect(
        container.read(posPolicyProvider).discountSupervisorAbovePercent,
        90,
      );

      await container.read(deviceCredentialProvider.notifier).forget();
      await Future<void>.delayed(Duration.zero);

      expect(
        container.read(posPolicyProvider).discountSupervisorAbovePercent,
        10,
      );
      expect(await store.read(), isNull);
    });
  });
}
