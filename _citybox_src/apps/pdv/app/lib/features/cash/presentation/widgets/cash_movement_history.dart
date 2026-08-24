import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/ui/pdv_table.dart';

/// Colunas do histórico de gaveta, no mesmo desenho das demais tabelas.
const List<PdvTableColumn> cashMovementColumns = <PdvTableColumn>[
  PdvTableColumn('Tipo'),
  PdvTableColumn('Data / Hora', flex: 3),
  PdvTableColumn('Valor'),
  PdvTableColumn('Operação', flex: 3),
  PdvTableColumn('Operador', flex: 2),
  PdvTableColumn('Ações'),
];

/// Coluna direita da tela: o que já entrou e saiu da gaveta neste turno.
///
/// Fica ao lado do formulário, e não numa tela à parte, porque as duas
/// perguntas são a mesma: antes de sangrar, o operador quer ver quanto já
/// sangrou. Separá-las obrigaria a decorar o histórico e voltar.
class CashMovementHistory extends StatelessWidget {
  const CashMovementHistory({required this.movements, super.key});

  final List<CashMovement> movements;

  @override
  Widget build(BuildContext context) {
    // Mais recente primeiro: o movimento que acabou de ser lançado é o que se
    // quer conferir.
    final List<CashMovement> ordered = <CashMovement>[...movements]..sort(
      (CashMovement a, CashMovement b) => b.createdAt.compareTo(a.createdAt),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.fromLTRB(
            PdvSpacing.xl,
            PdvSpacing.lg,
            PdvSpacing.xl,
            PdvSpacing.lg,
          ),
          child: Row(
            children: <Widget>[
              const Icon(
                Icons.history,
                size: PdvSizes.iconLg,
                color: PdvColors.textPrimary,
              ),
              const SizedBox(width: PdvSpacing.sm),
              Text('Histórico', style: PdvTypography.headingMd),
            ],
          ),
        ),
        const PdvTableHeader(columns: cashMovementColumns),
        Expanded(
          child:
              ordered.isEmpty
                  ? const PdvTableEmpty(message: 'Sem dados para mostrar')
                  : ListView.builder(
                    itemCount: ordered.length,
                    itemBuilder: (BuildContext context, int index) {
                      return _MovementRow(
                        movement: ordered[index],
                        striped: index.isOdd,
                      );
                    },
                  ),
        ),
      ],
    );
  }
}

class _MovementRow extends StatelessWidget {
  const _MovementRow({required this.movement, required this.striped});

  final CashMovement movement;
  final bool striped;

  @override
  Widget build(BuildContext context) {
    final bool isWithdrawal = movement.type == CashMovementType.withdrawal;
    // Sangria em vermelho, reforço em verde — o mesmo par das abas acima. A
    // cor diz para que lado o dinheiro foi antes de o olho ler o rótulo.
    final Color typeColor = isWithdrawal ? PdvColors.danger : PdvColors.success;

    return Material(
      color: striped ? PdvColors.surfaceMuted : Colors.transparent,
      child: DecoratedBox(
        decoration: const BoxDecoration(
          border: Border(bottom: BorderSide(color: PdvCounterColors.border)),
        ),
        child: Padding(
          padding: pdvTableRowPadding,
          child: Row(
            children: <Widget>[
              PdvTableCell(
                isWithdrawal ? 'Sangria' : 'Reforço',
                flex: cashMovementColumns[0].flex,
                color: typeColor,
              ),
              PdvTableCell(
                formatCashMovementDateTime(movement.createdAt),
                flex: cashMovementColumns[1].flex,
                color: PdvColors.textPrimary,
              ),
              PdvTableCell(
                formatCents(movement.amountCents),
                flex: cashMovementColumns[2].flex,
                color: typeColor,
                tabular: true,
              ),
              PdvTableCell(
                movement.operation.label,
                flex: cashMovementColumns[3].flex,
                color: PdvColors.textPrimary,
              ),
              // Dinheiro saindo da gaveta sem responsável é linha que não serve
              // para conferência nenhuma.
              PdvTableCell(
                movement.operatorName ?? '—',
                flex: cashMovementColumns[4].flex,
                color:
                    movement.operatorName == null
                        ? PdvColors.textDisabled
                        : PdvColors.textPrimary,
              ),
              Expanded(
                flex: cashMovementColumns[5].flex,
                child: Row(
                  children: <Widget>[
                    const Spacer(),
                    Tooltip(
                      message: movement.reason,
                      child: const Icon(
                        Icons.sticky_note_2_outlined,
                        size: PdvSizes.iconMd,
                        color: PdvColors.textSecondary,
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

/// `dd/MM/yyyy HH:mm`, mesmo formato das outras tabelas.
String formatCashMovementDateTime(DateTime value) {
  final DateTime local = value.toLocal();
  final String d = local.day.toString().padLeft(2, '0');
  final String m = local.month.toString().padLeft(2, '0');
  final String h = local.hour.toString().padLeft(2, '0');
  final String min = local.minute.toString().padLeft(2, '0');
  return '$d/$m/${local.year} $h:$min';
}
