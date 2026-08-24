import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';

/// Ação primária do rodapé (ex.: Novo cliente) — mais destaque que Cancelar.
class PdvEntityPickerPrimaryAction {
  const PdvEntityPickerPrimaryAction({
    required this.label,
    required this.onPressed,
    this.leading,
  });

  final String label;
  final VoidCallback onPressed;
  final Widget? leading;
}

/// Shell de diálogo de lista com busca — padrão Cliente / Vendedor.
///
/// Anatomia: cabeçalho escuro · busca · lista · rodapé (Cancelar + opcional
/// primário). Não fecha ao tocar fora.
class PdvEntityPickerDialog extends StatelessWidget {
  const PdvEntityPickerDialog({
    required this.title,
    required this.icon,
    required this.onSearchChanged,
    required this.list,
    required this.onCancel,
    this.searchHint = 'Buscar',
    this.onSearchSubmitted,
    this.loading = false,
    this.height = PdvSizes.dialogCustomerListHeight,
    this.primaryAction,
    this.extraShortcuts = const <ShortcutActivator, VoidCallback>{},
    super.key,
  });

  final String title;
  final IconData icon;
  final String searchHint;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String>? onSearchSubmitted;
  final bool loading;
  final double height;

  /// Corpo da lista (já com `Expanded` interno do shell).
  final Widget list;

  final VoidCallback onCancel;
  final PdvEntityPickerPrimaryAction? primaryAction;
  final Map<ShortcutActivator, VoidCallback> extraShortcuts;

  @override
  Widget build(BuildContext context) {
    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.escape): onCancel,
        ...extraShortcuts,
      },
      child: Focus(
        autofocus: true,
        child: Dialog(
          backgroundColor: PdvColors.surface,
          surfaceTintColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(
            horizontal: PdvSpacing.xxl,
            vertical: PdvSpacing.xl,
          ),
          shape: const RoundedRectangleBorder(borderRadius: PdvRadius.baseAll),
          clipBehavior: Clip.antiAlias,
          child: PdvDialogBody(
            size: PdvDialogSize.large,
            height: height,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                _Header(title: title, icon: icon, onClose: onCancel),
                Expanded(
                  child: ColoredBox(
                    color: PdvColors.surface,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: <Widget>[
                        Padding(
                          padding: const EdgeInsets.fromLTRB(
                            PdvSpacing.xl,
                            PdvSpacing.lg,
                            PdvSpacing.xl,
                            PdvSpacing.md,
                          ),
                          child: _SearchField(
                            hintText: searchHint,
                            onChanged: onSearchChanged,
                            onSubmitted: onSearchSubmitted,
                          ),
                        ),
                        if (loading)
                          const LinearProgressIndicator(minHeight: 2),
                        Expanded(child: list),
                      ],
                    ),
                  ),
                ),
                _Footer(onCancel: onCancel, primary: primaryAction),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Linha padrão da lista (ícone + rótulo + seleção).
class PdvEntityPickerTile extends StatelessWidget {
  const PdvEntityPickerTile({
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.leading,
    this.trailing,
    this.subtitle,
    super.key,
  });

  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final Widget? leading;
  final Widget? trailing;
  final Widget? subtitle;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: isSelected ? PdvColors.brandSurface : Colors.transparent,
      child: SizedBox(
        height: PdvSizes.controlHeight,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Expanded(
              child: InkWell(
                onTap: onTap,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: PdvSpacing.xl,
                  ),
                  child: Row(
                    children: <Widget>[
                      if (leading != null) ...<Widget>[
                        leading!,
                        const SizedBox(width: PdvSpacing.md),
                      ],
                      Expanded(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            Text(
                              label,
                              style: PdvTypography.bodyLg.copyWith(
                                color: PdvColors.textPrimary,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                            if (subtitle != null) subtitle!,
                          ],
                        ),
                      ),
                      if (isSelected && trailing == null)
                        const Icon(
                          Icons.check,
                          size: PdvSizes.iconMd,
                          color: PdvColors.focusRing,
                        ),
                    ],
                  ),
                ),
              ),
            ),
            if (trailing != null) trailing!,
          ],
        ),
      ),
    );
  }
}

/// Mensagem central quando a lista filtrada está vazia.
class PdvEntityPickerEmpty extends StatelessWidget {
  const PdvEntityPickerEmpty(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(PdvSpacing.xl),
      child: Text(
        message,
        style: PdvTypography.bodyLg.copyWith(color: PdvColors.textSecondary),
        textAlign: TextAlign.center,
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({
    required this.title,
    required this.icon,
    required this.onClose,
  });

  final String title;
  final IconData icon;
  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: PdvAppBarColors.background,
      child: SizedBox(
        height: PdvSizes.appBarHeight,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.lg),
          child: Row(
            children: <Widget>[
              Icon(
                icon,
                size: PdvSizes.iconMd,
                color: PdvAppBarColors.foreground,
              ),
              const SizedBox(width: PdvSpacing.sm),
              Expanded(
                child: Text(
                  title,
                  style: PdvTypography.headingSm.copyWith(
                    color: PdvAppBarColors.foreground,
                  ),
                ),
              ),
              IconButton(
                tooltip: 'Fechar',
                onPressed: onClose,
                icon: const Icon(
                  Icons.close,
                  size: PdvSizes.iconLg,
                  color: PdvAppBarColors.foreground,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.onCancel, this.primary});

  final VoidCallback onCancel;
  final PdvEntityPickerPrimaryAction? primary;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: PdvSizes.controlHeightLg,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Expanded(
            child: _FooterButton(
              label: 'CANCELAR (ESC)',
              background: PdvColors.surfaceMuted,
              foreground: PdvColors.textSecondary,
              onPressed: onCancel,
            ),
          ),
          if (primary != null)
            Expanded(
              child: _FooterButton(
                label: primary!.label,
                background: PdvColors.brand,
                foreground: PdvColors.onBrand,
                leading: primary!.leading,
                onPressed: primary!.onPressed,
              ),
            ),
        ],
      ),
    );
  }
}

class _FooterButton extends StatelessWidget {
  const _FooterButton({
    required this.label,
    required this.background,
    required this.foreground,
    required this.onPressed,
    this.leading,
  });

  final String label;
  final Color background;
  final Color foreground;
  final VoidCallback onPressed;
  final Widget? leading;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: background,
      child: InkWell(
        onTap: onPressed,
        hoverColor: PdvColors.shade.withValues(alpha: 0.12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.sm),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: <Widget>[
              if (leading != null) ...<Widget>[
                IconTheme(
                  data: IconThemeData(color: foreground, size: PdvSizes.iconMd),
                  child: leading!,
                ),
                const SizedBox(width: PdvSpacing.xs),
              ],
              Flexible(
                child: Text(
                  label,
                  style: PdvTypography.label.copyWith(color: foreground),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchField extends StatelessWidget {
  const _SearchField({
    required this.hintText,
    required this.onChanged,
    this.onSubmitted,
  });

  final String hintText;
  final ValueChanged<String> onChanged;
  final ValueChanged<String>? onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
      autofocus: true,
      onChanged: onChanged,
      onSubmitted: onSubmitted,
      textInputAction: TextInputAction.search,
      style: PdvTypography.bodyLg.copyWith(color: PdvColors.textPrimary),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: PdvTypography.bodyMd.copyWith(color: PdvColors.textDisabled),
        suffixIcon: Icon(
          Icons.search,
          size: PdvSizes.iconMd,
          color: PdvColors.focusRing,
        ),
      ),
    );
  }
}
