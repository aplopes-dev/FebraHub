import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_definition.dart';
import 'package:citybox_pdv/features/modules/domain/pdv_module_enums.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_section_shell.dart';

/// Módulos habilitados — configurado no ERP, só leitura aqui.
class SettingsModulesSection extends ConsumerWidget {
  const SettingsModulesSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ModuleSetSnapshot modules = ref.watch(moduleVisibilityProvider);

    return SettingsSectionShell(
      groupLabel: 'Configurado no ERP — somente leitura neste terminal',
      children: <Widget>[
        for (final PdvModuleDefinition def in pdvModuleCatalog)
          if (def.kind == PdvModuleKind.screen &&
              def.id != PdvModuleIds.delivery)
            ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(def.label, style: PdvTypography.bodyLg),
              subtitle: Text(
                _stateLabel(modules.states[def.id]),
                style: PdvTypography.bodySm.copyWith(
                  color: PdvColors.textSecondary,
                ),
              ),
              trailing: Icon(
                Icons.lock_outline,
                size: PdvSizes.iconMd,
                color: PdvColors.textSecondary,
              ),
            ),
      ],
    );
  }

  String _stateLabel(PdvModuleState? state) {
    return switch (state) {
      PdvModuleState.available => 'Disponível',
      PdvModuleState.disabled => 'Desligado',
      PdvModuleState.blocked => 'Bloqueado',
      null => 'Desligado',
    };
  }
}
