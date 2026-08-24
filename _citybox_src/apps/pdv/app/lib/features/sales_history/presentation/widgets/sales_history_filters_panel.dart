import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/sales_history/application/sales_history_controller.dart';

/// Painel de filtros das Últimas vendas, aberto pelo botão **Filtros**.
///
/// Fica embutido abaixo da barra, e não num diálogo: o operador compara o que
/// filtrou com o que a tabela devolveu, e um modal por cima da tabela esconde
/// justamente o resultado que ele quer conferir.
///
/// O estado é **rascunho** — mexer nos campos não filtra nada até **Aplicar**.
/// Sem isso, escolher "de" antes de "até" filtraria com meio período no meio
/// da digitação, e a tabela piscaria a cada toque.
class SalesHistoryFiltersPanel extends StatefulWidget {
  const SalesHistoryFiltersPanel({
    required this.query,
    required this.onApply,
    required this.onClear,
    super.key,
  });

  final SalesHistoryQuery query;
  final void Function({
    required SalesHistoryStatusFilter status,
    required DateTime? from,
    required DateTime? to,
  })
  onApply;
  final VoidCallback onClear;

  @override
  State<SalesHistoryFiltersPanel> createState() =>
      _SalesHistoryFiltersPanelState();
}

class _SalesHistoryFiltersPanelState extends State<SalesHistoryFiltersPanel> {
  late SalesHistoryStatusFilter _status;
  late DateTime? _from;
  late DateTime? _to;

  @override
  void initState() {
    super.initState();
    _status = widget.query.status;
    _from = widget.query.from;
    _to = widget.query.to;
  }

  Future<void> _pick({required bool isFrom}) async {
    final DateTime now = DateTime.now();
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: (isFrom ? _from : _to) ?? now,
      // O histórico é do turno aberto; um ano para trás cobre qualquer turno
      // que o terminal ainda tenha em memória, com folga.
      firstDate: DateTime(now.year - 1),
      lastDate: now,
      helpText: isFrom ? 'Vendas a partir de' : 'Vendas até',
      cancelText: 'Cancelar',
      confirmText: 'Selecionar',
    );
    if (picked == null) return;
    setState(() {
      if (isFrom) {
        _from = picked;
      } else {
        _to = picked;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: const BoxDecoration(
        color: PdvColors.background,
        border: Border(bottom: BorderSide(color: PdvCounterColors.border)),
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          PdvSpacing.xl,
          PdvSpacing.lg,
          PdvSpacing.xl,
          0,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Período',
              style: PdvTypography.headingSm.copyWith(
                color: PdvColors.textPrimary,
              ),
            ),
            const SizedBox(height: PdvSpacing.md),
            Row(
              children: <Widget>[
                Expanded(
                  child: _DateField(
                    label: 'De',
                    value: _from,
                    onPressed: () => _pick(isFrom: true),
                    onClear:
                        _from == null
                            ? null
                            : () => setState(() => _from = null),
                  ),
                ),
                const SizedBox(width: PdvSpacing.xl),
                Expanded(
                  child: _DateField(
                    label: 'Até',
                    value: _to,
                    onPressed: () => _pick(isFrom: false),
                    onClear:
                        _to == null ? null : () => setState(() => _to = null),
                  ),
                ),
              ],
            ),
            const SizedBox(height: PdvSpacing.xl),
            Text(
              'Situação',
              style: PdvTypography.headingSm.copyWith(
                color: PdvColors.textPrimary,
              ),
            ),
            const SizedBox(height: PdvSpacing.md),
            Wrap(
              spacing: PdvSpacing.sm,
              children: <Widget>[
                for (final SalesHistoryStatusFilter option
                    in SalesHistoryStatusFilter.values)
                  _StatusChip(
                    label: option.label,
                    selected: option == _status,
                    onPressed: () => setState(() => _status = option),
                  ),
              ],
            ),
            const SizedBox(height: PdvSpacing.lg),
            const Divider(height: 1, color: PdvCounterColors.border),
            SizedBox(
              height: PdvSizes.appBarHeight,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: <Widget>[
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _status = SalesHistoryStatusFilter.all;
                        _from = null;
                        _to = null;
                      });
                      widget.onClear();
                    },
                    child: Text(
                      'LIMPAR FILTROS',
                      style: PdvTypography.label.copyWith(
                        color: PdvColors.textPrimary,
                      ),
                    ),
                  ),
                  const SizedBox(width: PdvSpacing.md),
                  FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: PdvColors.success,
                      foregroundColor: PdvColors.background,
                      minimumSize: const Size(140, PdvSizes.controlHeightSm),
                    ),
                    onPressed:
                        () => widget.onApply(
                          status: _status,
                          from: _from,
                          to: _to,
                        ),
                    child: const Text('APLICAR'),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Campo de data só-leitura: abre o seletor no toque.
///
/// Não é `TextField` com máscara porque a data aqui não é digitada — o
/// operador escolhe no calendário. Um campo editável convidaria a digitar e
/// exigiria validar formato à toa.
class _DateField extends StatelessWidget {
  const _DateField({
    required this.label,
    required this.value,
    required this.onPressed,
    required this.onClear,
  });

  final String label;
  final DateTime? value;
  final VoidCallback onPressed;

  /// `null` esconde o botão de limpar — não há data escolhida.
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final DateTime? picked = value;
    final String text =
        picked == null
            ? label
            : '${picked.day.toString().padLeft(2, '0')}/'
                '${picked.month.toString().padLeft(2, '0')}/${picked.year}';

    return InkWell(
      onTap: onPressed,
      child: Container(
        height: PdvSizes.controlHeight,
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: PdvColors.border)),
        ),
        child: Row(
          children: <Widget>[
            Expanded(
              child: Text(
                text,
                style: PdvTypography.bodyMd.copyWith(
                  color:
                      picked == null
                          ? PdvColors.textDisabled
                          : PdvColors.textPrimary,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            if (onClear != null)
              IconButton(
                onPressed: onClear,
                icon: const Icon(Icons.close, size: PdvSizes.iconSm),
                color: PdvColors.textSecondary,
                tooltip: 'Limpar $label',
              ),
            Icon(
              Icons.calendar_today_outlined,
              size: PdvSizes.iconMd,
              color: PdvColors.textSecondary,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.selected,
    required this.onPressed,
  });

  final String label;
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? PdvCounterColors.accent : PdvColors.surfaceMuted,
      child: InkWell(
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: PdvSpacing.lg,
            vertical: PdvSpacing.md,
          ),
          child: Text(
            label,
            style: PdvTypography.label.copyWith(
              color: selected ? PdvColors.onBrand : PdvColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}
