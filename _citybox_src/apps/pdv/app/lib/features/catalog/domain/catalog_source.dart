import 'package:citybox_pdv/features/catalog/domain/catalog_snapshot.dart';

/// Origem injetável do catálogo do terminal.
abstract class CatalogSource {
  /// Rede se possível; senão cache / vazio (ver [HttpCatalogSource]).
  Future<CatalogSnapshot> load();
}
