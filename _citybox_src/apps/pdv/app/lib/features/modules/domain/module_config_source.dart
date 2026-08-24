import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';

/// Origem injetável do conjunto de módulos do terminal (FR-005).
abstract class ModuleConfigSource {
  Future<ModuleSetSnapshot> load();

  Future<void> save(ModuleSetSnapshot snapshot);
}
