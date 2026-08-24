import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/delivery/application/delivery_orders_controller.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';

/// Resultado do painel: `null` = cancelou; caso contrário, o recorte escolhido.
typedef DeliveryFiltersResult =
    ({
      Set<DeliveryFulfillment> fulfillments,
      Set<DeliveryStatusFilter> statuses,
    });

/// Filtros dos pedidos, numa folha que entra pela **direita**.
///
/// Lateral e não embutida como a de Últimas vendas: ali o conteúdo é uma
/// tabela que cresce para baixo, e empurrá-la funciona; aqui é um quadro de
/// colunas de altura cheia, e empurrar o topo espremeria as quatro colunas.
Future<DeliveryFiltersResult?> showDeliveryFiltersSheet(
  BuildContext context, {
  required DeliveryOrdersQuery query,
}) {
  return showGeneralDialog<DeliveryFiltersResult>(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Fechar filtros',
    barrierColor: PdvColors.barrier,
    transitionDuration: PdvMotion.normal,
    pageBuilder: (_, __, ___) => const SizedBox.shrink(),
    transitionBuilder: (BuildContext ctx, Animation<double> animation, _, __) {
      return SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(1, 0),
          end: Offset.zero,
        ).animate(CurvedAnimation(parent: animation, curve: PdvMotion.curve)),
        child: Align(
          alignment: Alignment.centerRight,
          child: _FiltersSheet(query: query),
        ),
      );
    },
  );
}

class _FiltersSheet extends StatefulWidget {
  const _FiltersSheet({required this.query});

  final DeliveryOrdersQuery query;

  @override
  State<_FiltersSheet> createState() => _FiltersSheetState();
}

class _FiltersSheetState extends State<_FiltersSheet> {
  late Set<DeliveryFulfillment> _fulfillments = <DeliveryFulfillment>{
    ...widget.query.fulfillments,
  };
  late Set<DeliveryStatusFilter> _statuses = <DeliveryStatusFilter>{
    ...widget.query.statuses,
  };

  @override
  Widget build(BuildContext context) {
    return Material(
      color: PdvColors.surface,
      child: SizedBox(
        width: PdvSizes.dialogMdWidth,
        height: double.infinity,
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              Padding(
                padding: const EdgeInsets.fromLTRB(
                  PdvSpacing.xl,
                  PdvSpacing.lg,
                  PdvSpacing.md,
                  PdvSpacing.lg,
                ),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: Text('Filtros', style: PdvTypography.headingMd),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close, size: PdvSizes.iconMd),
                      color: PdvColors.textSecondary,
                      tooltip: 'Fechar',
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: PdvColors.border),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(PdvSpacing.xl),
                  children: <Widget>[
                    _SectionTitle('Forma de entrega'),
                    for (final DeliveryFulfillment option
                        in DeliveryFulfillment.values)
                      _CheckRow(
                        label: option.label,
                        checked: _fulfillments.contains(option),
                        onChanged:
                            (bool value) => setState(() {
                              if (value) {
                                _fulfillments.add(option);
                              } else {
                                _fulfillments.remove(option);
                              }
                            }),
                      ),
                    const SizedBox(height: PdvSpacing.xl),
                    _SectionTitle('Situação'),
                    for (final DeliveryStatusFilter option
                        in DeliveryStatusFilter.values)
                      _CheckRow(
                        label: option.label,
                        checked: _statuses.contains(option),
                        onChanged:
                            (bool value) => setState(() {
                              if (value) {
                                _statuses.add(option);
                              } else {
                                _statuses.remove(option);
                              }
                            }),
                      ),
                  ],
                ),
              ),
              const Divider(height: 1, color: PdvColors.border),
              Padding(
                padding: const EdgeInsets.all(PdvSpacing.lg),
                child: Row(
                  children: <Widget>[
                    Expanded(
                      child: TextButton(
                        style: TextButton.styleFrom(
                          minimumSize: const Size.fromHeight(
                            PdvSizes.controlHeight,
                          ),
                        ),
                        onPressed:
                            () => setState(() {
                              _fulfillments = <DeliveryFulfillment>{};
                              _statuses = <DeliveryStatusFilter>{};
                            }),
                        child: Text(
                          'LIMPAR FILTROS',
                          style: PdvTypography.label.copyWith(
                            color: PdvColors.textPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: PdvSpacing.md),
                    Expanded(
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: PdvColors.success,
                          foregroundColor: PdvColors.background,
                          minimumSize: const Size.fromHeight(
                            PdvSizes.controlHeight,
                          ),
                        ),
                        onPressed:
                            () => Navigator.pop(context, (
                              fulfillments: _fulfillments,
                              statuses: _statuses,
                            )),
                        child: const Text('APLICAR'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: PdvSpacing.sm),
      child: Text(
        label,
        style: PdvTypography.headingSm.copyWith(color: PdvColors.textPrimary),
      ),
    );
  }
}

class _CheckRow extends StatelessWidget {
  const _CheckRow({
    required this.label,
    required this.checked,
    required this.onChanged,
  });

  final String label;
  final bool checked;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => onChanged(!checked),
      child: SizedBox(
        height: PdvSizes.controlHeight,
        child: Row(
          children: <Widget>[
            Checkbox(
              value: checked,
              onChanged: (bool? value) => onChanged(value ?? false),
            ),
            const SizedBox(width: PdvSpacing.sm),
            Expanded(child: Text(label, style: PdvTypography.bodyLg)),
          ],
        ),
      ),
    );
  }
}
