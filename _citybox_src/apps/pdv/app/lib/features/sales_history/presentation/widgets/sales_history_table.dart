import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/ui/pdv_table.dart';

/// Colunas da tabela de vendas — declaradas uma vez, servem ao cabeçalho e às
/// linhas (ver `PdvTableColumn`).
const List<PdvTableColumn> salesHistoryColumns = <PdvTableColumn>[
  PdvTableColumn('Código'),
  PdvTableColumn('Data / Hora', flex: 3),
  PdvTableColumn('Cliente', flex: 3),
  PdvTableColumn('Operador', flex: 3),
  PdvTableColumn('Número'),
  PdvTableColumn('Valor'),
  PdvTableColumn('Nota Fiscal'),
  PdvTableColumn('Ações'),
];

/// Cabeçalho fixo da tabela.
class SalesHistoryTableHeader extends StatelessWidget {
  const SalesHistoryTableHeader({this.isLoading = false, super.key});

  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return PdvTableHeader(columns: salesHistoryColumns, isLoading: isLoading);
  }
}

/// Linha de venda.
class SalesHistoryRow extends StatelessWidget {
  const SalesHistoryRow({
    required this.sale,
    required this.onOpen,
    this.striped = false,
    super.key,
  });

  final SaleRecord sale;
  final VoidCallback onOpen;

  /// Faixa alternada. Numa tabela de sete colunas lida a distância de braço, é
  /// o que impede o olho de pular de linha ao correr da esquerda para a
  /// direita.
  final bool striped;

  @override
  Widget build(BuildContext context) {
    final bool cancelled = sale.status == SaleRecordStatus.cancelled;
    final Color foreground =
        cancelled ? PdvColors.textDisabled : PdvColors.textPrimary;

    return Material(
      color: striped ? PdvColors.surfaceMuted : Colors.transparent,
      child: InkWell(
        onTap: onOpen,
        hoverColor: PdvCounterColors.surfaceHover,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            border: Border(bottom: BorderSide(color: PdvCounterColors.border)),
          ),
          child: Padding(
            padding: pdvTableRowPadding,
            child: Row(
              children: <Widget>[
                // Sequência do turno (Zerar numeração). Nunca o UUID do ERP —
                // o operador lê o código a braço de distância no caixa.
                PdvTableCell(
                  sale.number == 0 ? '—' : sale.number.toString(),
                  flex: salesHistoryColumns[0].flex,
                  color: foreground,
                  tabular: true,
                  strikethrough: cancelled,
                ),
                PdvTableCell(
                  formatSaleDateTime(sale.createdAt),
                  flex: salesHistoryColumns[1].flex,
                  color: foreground,
                ),
                PdvTableCell(
                  sale.customerName ?? 'Consumidor Final',
                  flex: salesHistoryColumns[2].flex,
                  color:
                      sale.customerName == null
                          ? PdvColors.textSecondary
                          : foreground,
                ),
                // Quem digitou a venda. Traço em venda gravada antes de o
                // operador existir no domínio — não "0" nem vazio, que se
                // confundem com dado real.
                PdvTableCell(
                  sale.operatorName ?? '—',
                  flex: salesHistoryColumns[3].flex,
                  color:
                      sale.operatorName == null
                          ? PdvColors.textDisabled
                          : foreground,
                ),
                // Número do pedido no ERP (`SaleOrder.number`), quando a venda
                // foi fechada online. Distinto do Código do turno.
                PdvTableCell(
                  sale.serverNumber == null
                      ? '—'
                      : sale.serverNumber.toString(),
                  flex: salesHistoryColumns[4].flex,
                  color:
                      sale.serverNumber == null
                          ? PdvColors.textDisabled
                          : foreground,
                  tabular: true,
                ),
                PdvTableCell(
                  formatCents(sale.totalCents),
                  flex: salesHistoryColumns[5].flex,
                  color: foreground,
                  tabular: true,
                  strikethrough: cancelled,
                ),
                // Sem emissão fiscal no app (ver AGENTS.md): a coluna existe
                // para a tabela bater com a do ERP, e mostra traço até haver
                // documento de verdade para exibir.
                PdvTableCell(
                  '—',
                  flex: salesHistoryColumns[6].flex,
                  color: PdvColors.textDisabled,
                ),
                Expanded(
                  flex: salesHistoryColumns[7].flex,
                  child: Row(
                    children: <Widget>[
                      // `Flexible`: com a etiqueta "Cancelada" **e** o chevron,
                      // a coluna estoura em tela estreita — e só nesse estado,
                      // que é o menos visitado da tela.
                      if (cancelled)
                        Flexible(
                          child: Text(
                            'Cancelada',
                            overflow: TextOverflow.ellipsis,
                            style: PdvTypography.caption.copyWith(
                              color: PdvColors.danger,
                            ),
                          ),
                        ),
                      const Spacer(),
                      Icon(
                        Icons.chevron_right,
                        size: PdvSizes.iconMd,
                        color: PdvColors.textSecondary,
                      ),
                    ],
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

/// `dd/MM/yyyy HH:mm` sem depender de `intl` — o app não tem a dependência, e
/// puxá-la só por esta coluna não se paga.
String formatSaleDateTime(DateTime value) {
  final DateTime local = value.toLocal();
  final String d = local.day.toString().padLeft(2, '0');
  final String m = local.month.toString().padLeft(2, '0');
  final String h = local.hour.toString().padLeft(2, '0');
  final String min = local.minute.toString().padLeft(2, '0');
  return '$d/$m/${local.year} $h:$min';
}
