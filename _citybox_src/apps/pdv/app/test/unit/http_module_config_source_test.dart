import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/modules/data/http_module_config_source.dart';
import 'package:citybox_pdv/features/modules/data/pos_module_api.dart';
import 'package:citybox_pdv/features/modules/data/shared_preferences_module_cache.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';

/// API de módulos sem rede.
class FakePosModuleApi implements PosModuleApi {
  FakePosModuleApi({this.states = const <String, PdvModuleState>{}});

  Map<String, PdvModuleState> states;
  PdvApiException? failure;
  int calls = 0;

  @override
  Future<ModuleSetSnapshot> current() async {
    calls++;
    final PdvApiException? forced = failure;
    if (forced != null) throw forced;
    return ModuleSetSnapshot(states: states, updatedAt: DateTime.now());
  }
}

const PdvApiException offline = PdvApiException(
  'Sem conexão com o servidor da loja.',
  isOffline: true,
);

void main() {
  late SharedPreferencesModuleCache cache;

  Future<void> setUpCache() async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    cache = SharedPreferencesModuleCache(await SharedPreferences.getInstance());
  }

  HttpModuleConfigSource build(FakePosModuleApi api, {bool paired = true}) {
    return HttpModuleConfigSource(
      api: api,
      cache: cache,
      isPaired: () => paired,
    );
  }

  setUp(setUpCache);

  test('servidor manda, e o conjunto vai para o cache', () async {
    final FakePosModuleApi api = FakePosModuleApi(
      states: <String, PdvModuleState>{
        PdvModuleIds.tables: PdvModuleState.disabled,
      },
    );

    final ModuleSetSnapshot snapshot = await build(api).load();

    expect(snapshot.isOperationallyVisible(PdvModuleIds.tables), isFalse);
    expect(await cache.read(), isNotNull);
  });

  test('sem rede, vale o último conjunto conhecido', () async {
    final FakePosModuleApi api = FakePosModuleApi(
      states: <String, PdvModuleState>{
        PdvModuleIds.delivery: PdvModuleState.disabled,
      },
    );
    await build(api).load();

    api.failure = offline;
    final ModuleSetSnapshot snapshot = await build(api).load();

    // Uma queda de rede não pode devolver ao caixa telas que a loja desligou.
    expect(snapshot.isOperationallyVisible(PdvModuleIds.delivery), isFalse);
  });

  test(
    'primeiro boot offline cai no perfil neutro, não em tudo ligado',
    () async {
      final FakePosModuleApi api = FakePosModuleApi()..failure = offline;

      final ModuleSetSnapshot snapshot = await build(api).load();

      // O perfil padrão é Restaurante — o ponto é que existe um conjunto
      // definido, e não uma tela cheia de botões que a loja nunca pediu.
      expect(snapshot.profileName, isNotNull);
    },
  );

  test('terminal não pareado nem pergunta ao servidor', () async {
    final FakePosModuleApi api = FakePosModuleApi();

    await build(api, paired: false).load();

    // A requisição sairia sem credencial, tomaria 401 e sujaria o log de boot.
    expect(api.calls, 0);
  });

  test('núcleo sobrevive a um servidor que tenta desligá-lo', () async {
    final FakePosModuleApi api = FakePosModuleApi(
      states: <String, PdvModuleState>{
        PdvModuleIds.cashHub: PdvModuleState.disabled,
        PdvModuleIds.counter: PdvModuleState.blocked,
      },
    );

    final ModuleSetSnapshot snapshot = await build(api).load();

    // Segunda barreira, depois da do servidor: um caixa que não fecha e um
    // Balcão que não vende não podem sair de uma resposta HTTP.
    expect(snapshot.isOperationallyVisible(PdvModuleIds.cashHub), isTrue);
    expect(snapshot.isOperationallyVisible(PdvModuleIds.counter), isTrue);
  });

  test('salvar grava só no cache, nunca no servidor', () async {
    final FakePosModuleApi api = FakePosModuleApi();
    final HttpModuleConfigSource source = build(api);

    await source.save(
      ModuleSetSnapshot(
        states: <String, PdvModuleState>{
          PdvModuleIds.tabs: PdvModuleState.disabled,
        },
        updatedAt: DateTime.now(),
      ),
    );

    // O painel do app é diagnóstico. Mandar de volta faria um terminal
    // reescrever a configuração da loja inteira.
    expect(api.calls, 0);
    expect(await cache.read(), isNotNull);
  });
}
