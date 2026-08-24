import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/modules/data/pos_module_api.dart';
import 'package:citybox_pdv/features/modules/data/segment_profiles.dart';
import 'package:citybox_pdv/features/modules/data/shared_preferences_module_cache.dart';
import 'package:citybox_pdv/features/modules/domain/module_config_source.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_validator.dart';

/// O ERP como fonte dos módulos, com o cache local como rede de proteção.
///
/// Substitui a `FixtureModuleConfigSource`, que era o combinado provisório
/// enquanto o servidor não tinha onde guardar isto. A interface
/// `ModuleConfigSource` existia desde o começo justamente para esta troca.
///
/// Ordem de tentativa em [load]:
///
/// 1. **Servidor** — a verdade. Grava no cache ao voltar.
/// 2. **Cache** — o último conjunto conhecido, quando não há rede.
/// 3. **Perfil neutro** — primeiro boot offline. Nunca "tudo ligado por
///    acidente": é o mesmo neutro que o servidor usaria.
class HttpModuleConfigSource implements ModuleConfigSource {
  const HttpModuleConfigSource({
    required PosModuleApi api,
    required SharedPreferencesModuleCache cache,
    required bool Function() isPaired,
  }) : _api = api,
       _cache = cache,
       _isPaired = isPaired;

  final PosModuleApi _api;
  final SharedPreferencesModuleCache _cache;

  /// Terminal não pareado não tem o que perguntar — e a requisição sairia sem
  /// credencial, tomando 401 e sujando o log de boot.
  final bool Function() _isPaired;

  @override
  Future<ModuleSetSnapshot> load() async {
    if (_isPaired()) {
      try {
        // Valida aqui também, e não só dentro da API: a garantia do núcleo não
        // pode depender de **qual** implementação de `PosModuleApi` está
        // injetada. Trocar a fonte não pode derrubar a proteção.
        final ModuleSetSnapshot fresh = ModuleSetValidator.ensureValid(
          await _api.current(),
        );
        await _cache.write(fresh);
        return fresh;
      } on PdvApiException {
        // Silencioso: acontece no boot, sem tela esperando. O custo aparece no
        // estado — o terminal opera com o conjunto anterior.
      }
    }

    final ModuleSetSnapshot? cached = await _cache.read();
    if (cached != null) return ModuleSetValidator.ensureValid(cached);

    return buildSegmentProfile(SegmentProfileNames.defaultProfile);
  }

  /// Grava **só no cache**.
  ///
  /// Quem decide a configuração é o ERP. Persistência local serve de fallback
  /// offline (e de overrides em teste) — mandar a alteração de volta faria um
  /// terminal reescrever a configuração da loja.
  @override
  Future<void> save(ModuleSetSnapshot snapshot) =>
      _cache.write(ModuleSetValidator.ensureValid(snapshot));
}
