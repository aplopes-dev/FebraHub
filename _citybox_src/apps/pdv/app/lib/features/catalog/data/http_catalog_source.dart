import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/catalog/data/pos_catalog_api.dart';
import 'package:citybox_pdv/features/catalog/data/shared_preferences_catalog_cache.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';
import 'package:citybox_pdv/features/catalog/domain/catalog_source.dart';

/// O ERP como fonte do catálogo, com cache local como rede de proteção.
///
/// Ordem em [load]:
///
/// 1. **Servidor** — verdade da unidade. Grava no cache ao voltar.
/// 2. **Cache** — último snapshot conhecido, quando não há rede.
/// 3. **Vazio** — primeiro boot offline. **Nunca** a fixture de produtos.
class HttpCatalogSource implements CatalogSource {
  const HttpCatalogSource({
    required PosCatalogApi api,
    required SharedPreferencesCatalogCache cache,
    required bool Function() isPaired,
  }) : _api = api,
       _cache = cache,
       _isPaired = isPaired;

  final PosCatalogApi _api;
  final SharedPreferencesCatalogCache _cache;
  final bool Function() _isPaired;

  @override
  Future<CatalogSnapshot> load() async {
    if (_isPaired()) {
      try {
        return await loadFresh();
      } on PdvApiException {
        // Silencioso no boot — o custo aparece no estado (cache ou vazio).
      }
    }

    final CatalogSnapshot? cached = await _cache.read();
    if (cached != null) return cached;

    return CatalogSnapshot.empty();
  }

  /// Rede obrigatória (Consulta de preço / sync explícito).
  Future<CatalogSnapshot> loadFresh() async {
    if (!_isPaired()) {
      throw const PdvApiException(
        'Terminal não pareado.',
        isOffline: true,
      );
    }
    final CatalogSnapshot fresh = await _api.current();
    await _cache.write(fresh);
    return fresh;
  }
}
