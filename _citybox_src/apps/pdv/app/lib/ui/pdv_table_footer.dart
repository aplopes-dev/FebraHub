import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Rodapé de paginação das tabelas do PDV.
///
/// Sempre visível, mesmo sem dados — some com ele e a tabela vazia perde o
/// piso, deixando a mensagem de vazio flutuando no fim da tela.
///
/// Compartilhado entre Últimas vendas e Pedidos delivery: dois rodapés
/// separados divergiriam no primeiro ajuste, e paginação é justamente o
/// controle em que o operador não quer pensar duas vezes.
class PdvTableFooter extends StatelessWidget {
  const PdvTableFooter({
    required this.page,
    required this.totalPages,
    required this.total,
    required this.onPrevious,
    required this.onNext,
    this.perPage,
    this.perPageOptions = const <int>[10, 20, 36, 50, 100],
    this.onPerPageChanged,
    super.key,
  });

  final int page;
  final int totalPages;
  final int total;

  /// `null` esconde o seletor de itens por página.
  final int? perPage;
  final List<int> perPageOptions;
  final ValueChanged<int>? onPerPageChanged;

  /// `null` desabilita o botão — primeira/última página.
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  @override
  Widget build(BuildContext context) {
    final int? size = perPage;
    final ValueChanged<int>? onSizeChanged = onPerPageChanged;

    return DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: PdvCounterColors.border)),
      ),
      child: SizedBox(
        height: PdvSizes.controlHeight,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.end,
          children: <Widget>[
            if (size != null && onSizeChanged != null) ...<Widget>[
              _PerPageSelector(
                value: size,
                options: perPageOptions,
                onChanged: onSizeChanged,
              ),
              const SizedBox(width: PdvSpacing.lg),
            ],
            Text(
              // Traço sem resultado: "0 / 0" lê como um total de verdade e faz
              // o operador procurar o registro que sumiu.
              total == 0 ? '—' : '$page / $totalPages',
              style: PdvTypography.caption.copyWith(
                color: PdvColors.textSecondary,
              ),
            ),
            const SizedBox(width: PdvSpacing.lg),
            _PagerButton(
              label: 'Voltar',
              icon: Icons.chevron_left,
              onPressed: onPrevious,
            ),
            _PagerButton(
              label: 'Próximo',
              icon: Icons.chevron_right,
              iconTrailing: true,
              onPressed: onNext,
            ),
            const SizedBox(width: PdvSpacing.lg),
          ],
        ),
      ),
    );
  }
}

class _PerPageSelector extends StatelessWidget {
  const _PerPageSelector({
    required this.value,
    required this.options,
    required this.onChanged,
  });

  final int value;
  final List<int> options;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    // O valor atual entra na lista mesmo fora das opções: um `perPage` vindo
    // de fora que não estivesse ali faria o DropdownButton lançar.
    final List<int> items = <int>{...options, value}.toList()..sort();

    return Tooltip(
      message: 'Registros por página',
      child: DropdownButton<int>(
        value: value,
        onChanged: (int? next) {
          if (next != null) onChanged(next);
        },
        underline: const SizedBox.shrink(),
        dropdownColor: PdvColors.surface,
        style: PdvTypography.bodySm.copyWith(color: PdvColors.textPrimary),
        icon: const Icon(
          Icons.arrow_drop_down,
          size: PdvSizes.iconMd,
          color: PdvColors.textSecondary,
        ),
        items: <DropdownMenuItem<int>>[
          for (final int option in items)
            DropdownMenuItem<int>(
              value: option,
              child: Text(option.toString()),
            ),
        ],
      ),
    );
  }
}

class _PagerButton extends StatelessWidget {
  const _PagerButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.iconTrailing = false,
  });

  final String label;
  final IconData icon;
  final bool iconTrailing;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final bool enabled = onPressed != null;
    final Color color =
        enabled ? PdvColors.textPrimary : PdvColors.textDisabled;
    final Widget iconWidget = Icon(icon, size: PdvSizes.iconMd, color: color);
    final Widget labelWidget = Text(
      label.toUpperCase(),
      style: PdvTypography.label.copyWith(color: color),
    );

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        hoverColor: PdvAppBarColors.hover,
        child: SizedBox(
          height: PdvSizes.controlHeight,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.md),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                if (!iconTrailing) ...<Widget>[
                  iconWidget,
                  const SizedBox(width: PdvSpacing.xs),
                ],
                labelWidget,
                if (iconTrailing) ...<Widget>[
                  const SizedBox(width: PdvSpacing.xs),
                  iconWidget,
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
