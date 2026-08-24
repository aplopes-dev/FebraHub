import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';

/// Largura da coluna de remover, à esquerda de cada linha — reservada mesmo
/// no cabeçalho, para as demais colunas alinharem com as da linha.
const double _leadingColumnWidth = 28;

/// Largura da coluna de quantidade.
const double _qntColumnWidth = 72;

/// Largura de cada coluna de dinheiro (valor unitário, desconto, valor
/// total) — a mesma para as três. Com o texto maior, "VALOR UNIT." e
/// "DESCONTO %" quebravam em duas linhas no cabeçalho num valor mais
/// estreito; este é o piso que devolve as duas a uma linha só.
const double _moneyColumnWidth = 150;

/// Em viewport médio a tabela perde largura — encolhe as colunas de
/// dinheiro antes de estourar o `Row`.
double _moneyWidthFor(double tableWidth) {
  if (tableWidth >= 900) {
    return _moneyColumnWidth;
  }
  if (tableWidth >= 700) {
    return 110;
  }
  return 88;
}

/// Vão entre as colunas fixas da direita — ficam juntas de propósito, são
/// uma unidade só (os números da venda).
const double _columnGap = PdvSpacing.sm;

/// Vão ao redor da coluna de produto — maior que [_columnGap] porque ela não
/// é mais uma coluna fixa entre iguais: separa o botão de remover do nome do
/// produto de um lado, e o botão de editar da coluna de quantidade do outro.
/// Sem essa folga extra os dois liam como colados nos vizinhos.
const double _productGap = PdvSpacing.lg;

/// Largura do botão de editar/"Salvar" — fixa, e não o tamanho do próprio
/// conteúdo: o ícone de editar e o texto "Salvar" têm larguras bem
/// diferentes, e sem uma largura própria a coluna de quantidade pularia de
/// lugar entre um estado e outro.
const double _editButtonWidth = 64;

/// Altura de uma linha, fixa e igual em qualquer estado. Os campos de edição
/// (quantidade, desconto) são construídos para caber exatamente aqui — ver
/// [_inlineFieldDecoration] — para a linha não "pular" de tamanho ao entrar
/// ou sair da edição.
const double _rowHeight = 44;

/// Lista dos itens lançados na venda em curso.
///
/// Cabeçalho fixo em maiúsculas (PRODUTO, QNT., VALOR UNIT., DESCONTO %,
/// VALOR TOTAL); abaixo, uma linha por produto ou o estado vazio.
///
/// **A coluna PRODUTO é flexível** — ocupa todo o espaço que sobra depois das
/// outras quatro, que têm largura fixa e ficam coladas na borda direita da
/// tabela. É o nome do produto que varia de tamanho entre vendas, não o resto:
/// quantidade, valores e desconto sempre cabem no mesmo espaço.
///
/// Tudo alinhado à esquerda, inclusive as colunas de dinheiro — é o que o PDV
/// de referência faz. Os valores usam dígitos de largura fixa
/// (`PdvTypography.tabular`), então as casas continuam alinhadas entre si
/// mesmo sem o alinhamento à direita que uma tabela de valores normalmente
/// pediria.
class CounterCartTable extends ConsumerWidget {
  const CounterCartTable({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final List<CounterCartLine> lines = ref.watch(counterCartProvider);
    return ColoredBox(
      // Mesmo fundo da grade de produtos: as duas leem como um plano só, e é
      // a borda de cima da grade que marca onde uma termina e a outra começa.
      color: PdvCounterColors.background,
      child: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final double moneyW = _moneyWidthFor(constraints.maxWidth);
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              _CartHeaderRow(moneyWidth: moneyW),
              Divider(
                height: PdvSizes.borderWidth,
                color: PdvCounterColors.border,
              ),
              Expanded(
                child:
                    lines.isEmpty
                        ? const Padding(
                          padding: EdgeInsets.only(top: PdvSpacing.lg),
                          child: PdvEmptyState(
                            title: 'Sem produtos',
                            icon: Icons.shopping_basket_outlined,
                          ),
                        )
                        : ListView.builder(
                          padding: EdgeInsets.zero,
                          itemCount: lines.length,
                          itemBuilder:
                              (BuildContext context, int index) => _CartLineRow(
                                line: lines[index],
                                moneyWidth: moneyW,
                              ),
                        ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _CartHeaderRow extends StatelessWidget {
  const _CartHeaderRow({required this.moneyWidth});

  final double moneyWidth;

  @override
  Widget build(BuildContext context) {
    final TextStyle style = PdvTypography.labelSm.copyWith(
      color: PdvCounterColors.foregroundMuted,
      letterSpacing: 0.4,
    );

    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: PdvSpacing.md,
        vertical: PdvSpacing.md,
      ),
      child: Row(
        children: <Widget>[
          // Vazia — só reserva o mesmo espaço do botão de remover da linha,
          // para "PRODUTO" começar exatamente onde o nome do produto começa.
          const SizedBox(width: _leadingColumnWidth),
          const SizedBox(width: _productGap),
          Expanded(child: Text('PRODUTO', style: style)),
          const SizedBox(width: _productGap),
          SizedBox(width: _qntColumnWidth, child: Text('QNT.', style: style)),
          const SizedBox(width: _columnGap),
          SizedBox(width: moneyWidth, child: Text('VALOR UNIT.', style: style)),
          const SizedBox(width: _columnGap),
          SizedBox(
            width: moneyWidth,
            // "DESCONTO %", não "DESCONTO (%)" — o parêntese empurrava o
            // cabeçalho pra duas linhas no tamanho de fonte maior.
            child: Text('DESCONTO %', style: style),
          ),
          const SizedBox(width: _columnGap),
          SizedBox(width: moneyWidth, child: Text('VALOR TOTAL', style: style)),
        ],
      ),
    );
  }
}

/// Uma linha lançada — produto, quantidade, valores e as duas ações da linha.
///
/// **Só quantidade e desconto são editáveis.** O valor unitário vem do
/// catálogo — outro sistema é dono dele — e a venda só lê, nunca sobrescreve.
///
/// **Estado próprio, não do carrinho**: se a linha está em edição e o que o
/// operador já digitou nos campos moram aqui, não em `counterCartProvider`.
/// Só viram estado de verdade — e só aí saem de dentro do widget — quando o
/// operador aperta "Salvar". Cancelar (fechar sem salvar) não deveria deixar
/// rastro no carrinho, e um estado que vive direto no provider deixaria.
class _CartLineRow extends ConsumerStatefulWidget {
  const _CartLineRow({required this.line, required this.moneyWidth});

  final CounterCartLine line;
  final double moneyWidth;

  @override
  ConsumerState<_CartLineRow> createState() => _CartLineRowState();
}

class _CartLineRowState extends ConsumerState<_CartLineRow> {
  bool _isEditing = false;
  bool _isHovered = false;

  final TextEditingController _quantityController = TextEditingController();
  final TextEditingController _discountController = TextEditingController();

  @override
  void dispose() {
    _quantityController.dispose();
    _discountController.dispose();
    super.dispose();
  }

  void _startEditing() {
    final CounterCartLine line = widget.line;
    _quantityController.text = '${line.quantity}';
    // 0 (sem desconto) fica em branco — não é um valor que dá para digitar
    // de volta (ver [_parseDiscountPercent]), então também não nasce escrito.
    _discountController.text =
        line.discountPercent == 0
            ? ''
            : line.discountPercent.toStringAsFixed(0);
    setState(() => _isEditing = true);
  }

  String _lineTitle(CounterCartLine line) {
    if (line.half != null) {
      return '½ ${line.half!.leftName} / ½ ${line.half!.rightName}';
    }
    if (line.variantLabel != null && line.variantLabel!.isNotEmpty) {
      return '${line.product.name} (${line.variantLabel})';
    }
    return line.product.name;
  }

  String? _lineSubtitle(CounterCartLine line) {
    final List<String> parts = <String>[];
    if (line.weightKg != null) {
      parts.add('${line.weightKg!.toStringAsFixed(3)} kg');
    }
    for (final CartAddon a in line.addons) {
      parts.add('+${a.name}');
    }
    final String? note = line.kitchenNote;
    if (note != null && note.isNotEmpty) {
      parts.add(note);
    }
    if (parts.isEmpty) {
      return null;
    }
    return parts.join(' · ');
  }

  void _save() {
    final int? quantity = _parseQuantity(_quantityController.text);
    final double? discountPercent = _parseDiscountPercent(
      _discountController.text,
    );

    if (quantity == null || discountPercent == null) {
      ScaffoldMessenger.of(context)
        ..clearSnackBars()
        ..showSnackBar(
          const SnackBar(
            content: Text(
              'Quantidade precisa ser maior que zero; desconto, um número '
              'inteiro de 1 a 100 (ou vazio, para nenhum).',
            ),
            duration: Duration(milliseconds: 2500),
          ),
        );
      return;
    }

    ref
        .read(counterCartProvider.notifier)
        .updateLine(
          widget.line.product.id,
          quantity: quantity,
          discountPercent: discountPercent,
        );
    setState(() => _isEditing = false);
  }

  @override
  Widget build(BuildContext context) {
    final CounterCartLine line = widget.line;
    final double moneyW = widget.moneyWidth;
    final TextStyle style = PdvTypography.bodyMd.copyWith(
      color: PdvCounterColors.foreground,
      fontFeatures: PdvTypography.tabular,
    );

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: ColoredBox(
        color: _isHovered ? PdvCounterColors.surfaceHover : Colors.transparent,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.md),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: _rowHeight),
            child: IntrinsicHeight(
              child: Row(
                // `stretch`: cada célula recebe a altura da linha inteira —
                // sem isso os botões e, principalmente, o campo de edição
                // ficariam do tamanho do próprio conteúdo, não do
                // `_rowHeight` fixo que a linha reserva (ver
                // `_inlineFieldDecoration`).
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  SizedBox(
                    width: _leadingColumnWidth,
                    child: _LineIconButton(
                      icon: Icons.delete_outline,
                      tooltip: 'Remover ${line.product.name}',
                      color: PdvCounterColors.danger,
                      onPressed:
                          () => ref
                              .read(counterCartProvider.notifier)
                              .removeLine(line.product.id),
                    ),
                  ),
                  const SizedBox(width: _productGap),
                  Expanded(
                    child: Row(
                      children: <Widget>[
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                _lineTitle(line),
                                style: style,
                                overflow: TextOverflow.ellipsis,
                              ),
                              if (_lineSubtitle(line) != null)
                                Text(
                                  _lineSubtitle(line)!,
                                  style: PdvTypography.caption.copyWith(
                                    color: PdvCounterColors.foregroundMuted,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                  maxLines: 2,
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: PdvSpacing.xs),
                        SizedBox(
                          width: _editButtonWidth,
                          child:
                              _isEditing
                                  ? _SaveButton(onPressed: _save)
                                  : _LineIconButton(
                                    icon: Icons.edit_outlined,
                                    tooltip: 'Editar ${line.product.name}',
                                    color: PdvCounterColors.accentMuted,
                                    onPressed: _startEditing,
                                  ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: _productGap),
                  SizedBox(
                    width: _qntColumnWidth,
                    child:
                        _isEditing
                            ? _QuantityField(
                              key: const ValueKey<String>(
                                'cart_line_quantity_field',
                              ),
                              controller: _quantityController,
                              onSubmitted: (_) => _save(),
                            )
                            : _StaticCell(
                              text: '${line.quantity}',
                              style: style,
                            ),
                  ),
                  const SizedBox(width: _columnGap),
                  SizedBox(
                    width: moneyW,
                    // Sempre estático — o preço vem do catálogo, esta tela só
                    // lê.
                    child: _StaticCell(
                      text: formatCents(line.goodsUnitCents),
                      style: style,
                    ),
                  ),
                  const SizedBox(width: _columnGap),
                  SizedBox(
                    width: moneyW,
                    child:
                        _isEditing
                            ? _DiscountPercentField(
                              key: const ValueKey<String>(
                                'cart_line_discount_field',
                              ),
                              controller: _discountController,
                              onSubmitted: (_) => _save(),
                            )
                            : _StaticCell(
                              text: _formatPercent(line.discountPercent),
                              style: style,
                            ),
                  ),
                  const SizedBox(width: _columnGap),
                  SizedBox(
                    width: moneyW,
                    child: _StaticCell(
                      text: formatCents(line.totalCents),
                      style: style,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Texto estático de uma célula, centralizado na altura da linha — a mesma
/// referência vertical que o campo de edição usa, para os dois não pularem
/// de posição um em relação ao outro quando a linha entra ou sai da edição.
class _StaticCell extends StatelessWidget {
  const _StaticCell({required this.text, required this.style});

  final String text;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(text, style: style),
    );
  }
}

/// Desconto é sempre número inteiro — não tem "10,5%" aqui.
String _formatPercent(double value) => '${value.toStringAsFixed(0)}%';

int? _parseQuantity(String raw) {
  final int? value = int.tryParse(raw.trim());
  if (value == null || value < 1) {
    return null;
  }
  return value;
}

/// Vazio é "sem desconto" (0%). Preenchido, só inteiro de 1 a 100 — sem casa
/// decimal (o campo já barra vírgula/ponto na digitação) e sem aceitar 0
/// digitado à mão: para "sem desconto" o campo é deixado em branco, não
/// zerado — os dois teriam o mesmo efeito, mas só um é o gesto natural de
/// apagar o que tinha.
double? _parseDiscountPercent(String raw) {
  final String trimmed = raw.trim();
  if (trimmed.isEmpty) {
    return 0;
  }
  final int? value = int.tryParse(trimmed);
  if (value == null || value < 1 || value > 100) {
    return null;
  }
  return value.toDouble();
}

/// Decoração comum aos campos de edição inline. `constraints: BoxConstraints()`
/// é o que importa mais aqui: sem isso, o piso de 48 px que
/// `InputDecorationTheme.constraints` aplica no app inteiro (ver
/// `pdv_theme.dart`) vence a altura de [_rowHeight] vinda do `Row` esticado
/// por fora, e o campo nasce mais alto que a própria linha.
InputDecoration _inlineFieldDecoration({String? suffixText}) {
  return InputDecoration(
    isDense: true,
    filled: true,
    fillColor: PdvCounterColors.surfaceStrong,
    constraints: const BoxConstraints(),
    contentPadding: const EdgeInsets.symmetric(horizontal: PdvSpacing.sm),
    suffixText: suffixText,
    suffixStyle: PdvTypography.bodyMd.copyWith(
      color: PdvCounterColors.foregroundMuted,
    ),
    border: const OutlineInputBorder(
      borderRadius: BorderRadius.zero,
      borderSide: BorderSide.none,
    ),
    enabledBorder: const OutlineInputBorder(
      borderRadius: BorderRadius.zero,
      borderSide: BorderSide.none,
    ),
    focusedBorder: const OutlineInputBorder(
      borderRadius: BorderRadius.zero,
      borderSide: BorderSide(
        color: PdvColors.focusRing,
        width: PdvSizes.borderWidthFocus,
      ),
    ),
  );
}

TextStyle _inlineFieldStyle() => PdvTypography.bodyMd.copyWith(
  color: PdvCounterColors.foreground,
  fontFeatures: PdvTypography.tabular,
);

/// Campo de quantidade — inteiro, teclado numérico dedicado (`TextInputType
/// .number`), sem vírgula: não existe meia unidade de produto aqui.
class _QuantityField extends StatelessWidget {
  const _QuantityField({
    super.key,
    required this.controller,
    required this.onSubmitted,
  });

  final TextEditingController controller;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      autofocus: true,
      keyboardType: TextInputType.number,
      inputFormatters: <TextInputFormatter>[
        FilteringTextInputFormatter.digitsOnly,
      ],
      onSubmitted: onSubmitted,
      // `expands`: sem isso o campo se dimensiona pela própria linha de
      // texto (~18 px) e não pela caixa de `_rowHeight` que o `Row` esticado
      // por fora dá pra ele — o preenchimento nasce colado no topo, com a
      // metade de baixo da linha mostrando o fundo por trás. Mesmo defeito
      // já corrigido no campo de CPF/CNPJ e no de busca; exige
      // `maxLines`/`minLines` nulos.
      expands: true,
      maxLines: null,
      minLines: null,
      textAlignVertical: TextAlignVertical.center,
      style: _inlineFieldStyle(),
      decoration: _inlineFieldDecoration(),
    );
  }
}

/// Campo de desconto — inteiro de 1 a 100, sem casa decimal. O sufixo "%" no
/// próprio campo evita que o operador confunda com reais depois que a
/// coluna deixou de mostrar `R$`.
class _DiscountPercentField extends StatelessWidget {
  const _DiscountPercentField({
    super.key,
    required this.controller,
    required this.onSubmitted,
  });

  final TextEditingController controller;
  final ValueChanged<String> onSubmitted;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      inputFormatters: <TextInputFormatter>[
        FilteringTextInputFormatter.digitsOnly,
      ],
      onSubmitted: onSubmitted,
      // Ver o comentário equivalente em `_QuantityField`.
      expands: true,
      maxLines: null,
      minLines: null,
      textAlignVertical: TextAlignVertical.center,
      style: _inlineFieldStyle(),
      decoration: _inlineFieldDecoration(suffixText: '%'),
    );
  }
}

/// Botão de remover/editar de uma linha — ícone pequeno, sem caixa própria: a
/// linha inteira já ganha destaque no hover (`_CartLineRowState`), um segundo
/// fundo aqui competiria com aquele realce.
class _LineIconButton extends StatelessWidget {
  const _LineIconButton({
    required this.icon,
    required this.tooltip,
    required this.color,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final Color color;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          child: Center(child: Icon(icon, size: PdvSizes.iconSm, color: color)),
        ),
      ),
    );
  }
}

/// Substitui o ícone de editar enquanto a linha está em edição — texto, não
/// ícone, porque "Salvar" precisa ser lido, não adivinhado: é a única ação
/// desta tela que grava no carrinho o que o operador acabou de digitar.
class _SaveButton extends StatelessWidget {
  const _SaveButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        child: Center(
          child: Text(
            'Salvar',
            style: PdvTypography.label.copyWith(
              color: PdvCounterColors.accentMuted,
            ),
          ),
        ),
      ),
    );
  }
}

/// Estado vazio migrado para [PdvEmptyState] (US6).
