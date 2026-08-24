import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_back.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/settings/domain/settings_section.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_favorites_section.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_modules_section.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_session_section.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_terminal_section.dart';
import 'package:citybox_pdv/features/settings/presentation/sections/settings_touch_section.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';

/// Configurações do terminal.
///
/// Navegação à esquerda, conteúdo à direita — e não uma página só rolando: as
/// seções não têm relação entre si (o que o ERP manda, o que é preferência
/// local, o que é só leitura), e empilhá-las obrigava a rolar até o fim para
/// descobrir o que existe.
class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  SettingsSection _section = SettingsSection.session;

  @override
  Widget build(BuildContext context) {
    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.escape, shift: true):
            () => popOrHome(context),
      },
      child: Focus(
        autofocus: true,
        child: PdvScaffold(
          contentPadding: EdgeInsets.zero,
          appBar: PdvAppBarChrome(
            child: Row(
              children: <Widget>[
                PdvAppBarButton(
                  icon: Icons.chevron_left,
                  label: 'Voltar',
                  secondaryLabel: '(Shift + Esc)',
                  tooltip: 'Voltar (Shift + Esc)',
                  iconSize: PdvSizes.iconLg,
                  onPressed: () => popOrHome(context),
                ),
                const _ToolbarSeparator(),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: PdvSpacing.lg,
                  ),
                  // O título repete a seção aberta, e não "Configurações":
                  // é o que diz ao operador onde ele está dentro da tela.
                  child: Text(
                    _section.label,
                    style: PdvTypography.headingSm.copyWith(
                      color: PdvAppBarColors.foreground,
                    ),
                  ),
                ),
              ],
            ),
          ),
          body: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              SizedBox(
                width: PdvSizes.settingsNavWidth,
                child: _SectionNav(
                  selected: _section,
                  onSelected:
                      (SettingsSection section) =>
                          setState(() => _section = section),
                ),
              ),
              const VerticalDivider(
                width: PdvSizes.borderWidth,
                color: PdvColors.border,
              ),
              Expanded(
                child: switch (_section) {
                  SettingsSection.session => const SettingsSessionSection(),
                  SettingsSection.touch => const SettingsTouchSection(),
                  SettingsSection.favorites => const SettingsFavoritesSection(),
                  SettingsSection.terminal => const SettingsTerminalSection(),
                  SettingsSection.modules => const SettingsModulesSection(),
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionNav extends StatelessWidget {
  const _SectionNav({required this.selected, required this.onSelected});

  final SettingsSection selected;
  final ValueChanged<SettingsSection> onSelected;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: PdvColors.surface,
      child: ListView(
        padding: const EdgeInsets.symmetric(vertical: PdvSpacing.sm),
        children: <Widget>[
          for (final SettingsSection section in SettingsSection.values)
            _NavItem(
              section: section,
              selected: section == selected,
              onPressed: () => onSelected(section),
            ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.section,
    required this.selected,
    required this.onPressed,
  });

  final SettingsSection section;
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? PdvColors.surfaceMuted : Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        hoverColor: PdvAppBarColors.hover,
        child: SizedBox(
          height: PdvSizes.controlHeight,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.xl),
            child: Row(
              children: <Widget>[
                Icon(
                  section.icon,
                  size: PdvSizes.iconMd,
                  color:
                      selected
                          ? PdvColors.textPrimary
                          : PdvColors.textSecondary,
                ),
                const SizedBox(width: PdvSpacing.lg),
                Expanded(
                  child: Text(
                    section.label,
                    style: PdvTypography.bodyLg.copyWith(
                      color:
                          selected
                              ? PdvColors.textPrimary
                              : PdvColors.textSecondary,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ToolbarSeparator extends StatelessWidget {
  const _ToolbarSeparator();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: PdvSizes.borderWidthFocus,
      height: PdvSizes.appBarHeight,
      color: PdvAppBarColors.separator,
    );
  }
}
