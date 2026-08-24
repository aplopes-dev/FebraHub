import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Respiro de uma linha de tabela — cabeçalho e dados usam o **mesmo**, senão
/// as colunas não alinham.
const EdgeInsets pdvTableRowPadding = EdgeInsets.symmetric(
  horizontal: PdvSpacing.xl,
  vertical: PdvSpacing.md,
);

/// Uma coluna: rótulo e proporção de largura.
///
/// A lista de colunas é declarada **uma vez** por tela e serve ao cabeçalho e
/// às linhas. Se cada um declarasse os próprios `flex`, a primeira mudança de
/// largura desalinharia título e dado — e desalinhamento numa tabela de
/// valores é o bug que ninguém nota até conferir a coluna errada.
class PdvTableColumn {
  const PdvTableColumn(this.label, {this.flex = 2});

  final String label;
  final int flex;
}

/// Cabeçalho fixo de tabela, com barra de carregamento opcional embaixo.
class PdvTableHeader extends StatelessWidget {
  const PdvTableHeader({
    required this.columns,
    this.isLoading = false,
    super.key,
  });

  final List<PdvTableColumn> columns;

  /// Desenha a barra de progresso logo abaixo do cabeçalho, no lugar da
  /// divisória. Fica **entre** o cabeçalho e os dados de propósito: é ali que
  /// o conteúdo vai aparecer, então é ali que o olho já está.
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Padding(
          padding: pdvTableRowPadding,
          child: Row(
            children: <Widget>[
              for (final PdvTableColumn column in columns)
                Expanded(
                  flex: column.flex,
                  child: Text(
                    column.label,
                    style: PdvTypography.labelSm.copyWith(
                      color: PdvCounterColors.foregroundMuted,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
            ],
          ),
        ),
        SizedBox(
          height: PdvSizes.borderWidthFocus,
          child:
              isLoading
                  ? const LinearProgressIndicator(
                    minHeight: PdvSizes.borderWidthFocus,
                    backgroundColor: PdvCounterColors.border,
                    color: PdvCounterColors.accent,
                  )
                  : const ColoredBox(color: PdvCounterColors.border),
        ),
      ],
    );
  }
}

/// Célula de dado.
class PdvTableCell extends StatelessWidget {
  const PdvTableCell(
    this.value, {
    required this.flex,
    required this.color,
    this.tabular = false,
    this.strikethrough = false,
    super.key,
  });

  final String value;
  final int flex;
  final Color color;

  /// Dígitos de mesma largura — obrigatório em número e valor, para as
  /// colunas alinharem na vertical.
  final bool tabular;
  final bool strikethrough;

  @override
  Widget build(BuildContext context) {
    final TextStyle base =
        tabular ? PdvTypography.amountSm : PdvTypography.bodySm;
    return Expanded(
      flex: flex,
      child: Text(
        value,
        style: base.copyWith(
          color: color,
          decoration: strikethrough ? TextDecoration.lineThrough : null,
        ),
        overflow: TextOverflow.ellipsis,
        maxLines: 1,
      ),
    );
  }
}

/// Vazio do corpo da tabela — texto seco, alinhado à área de dados.
///
/// Não usa `PdvEmptyState`: aquele é o vazio de uma tela inteira, com ícone
/// centralizado na vertical. Aqui a tabela já tem cabeçalho e rodapé
/// desenhados, e um bloco ilustrado no meio competiria com as colunas.
class PdvTableEmpty extends StatelessWidget {
  const PdvTableEmpty({required this.message, super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: PdvSpacing.xxl),
      child: Align(
        alignment: Alignment.topCenter,
        child: Text(
          message,
          style: PdvTypography.label.copyWith(color: PdvColors.textSecondary),
        ),
      ),
    );
  }
}
