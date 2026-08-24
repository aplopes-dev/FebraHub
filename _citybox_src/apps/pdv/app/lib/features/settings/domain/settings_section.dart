import 'package:flutter/material.dart';

/// Seções da tela de Configurações, na ordem da navegação à esquerda.
///
/// A ordem começa pelo que só se **lê** (a sessão em curso) e termina no que
/// só o ERP muda (módulos): quem entra aqui na maioria das vezes quer conferir
/// um dado, não mexer numa preferência.
enum SettingsSection { session, touch, favorites, terminal, modules }

extension SettingsSectionInfo on SettingsSection {
  String get label => switch (this) {
    SettingsSection.session => 'Informações da sessão',
    SettingsSection.touch => 'Touch screen',
    SettingsSection.favorites => 'Favoritos da tela inicial',
    SettingsSection.terminal => 'Terminal',
    SettingsSection.modules => 'Módulos',
  };

  IconData get icon => switch (this) {
    SettingsSection.session => Icons.info_outline,
    SettingsSection.touch => Icons.touch_app_outlined,
    SettingsSection.favorites => Icons.star_outline,
    SettingsSection.terminal => Icons.point_of_sale_outlined,
    SettingsSection.modules => Icons.widgets_outlined,
  };
}
