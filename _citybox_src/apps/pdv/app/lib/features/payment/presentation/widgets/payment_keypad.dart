import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/payment/application/payment_draft_controller.dart';
import 'package:citybox_pdv/features/payment/application/payment_summary_provider.dart';
import 'package:citybox_pdv/features/payment/domain/payment_summary.dart';

/// Largura da coluna central. Larga o bastante para as quatro teclas por fila
/// caberem confortáveis, estreita o bastante para a lista de pagamentos à
/// direita não ficar espremida.
const double _keypadWidth = 380;

/// Vão entre teclas.
const double _keyGap = PdvSpacing.sm;

/// Altura de uma tecla — bem acima do mínimo de toque (`PdvSizes
/// .controlHeight`, 48): aqui o operador digita olhando para o cliente, não
/// para a tela.
const double _keyHeight = 56;

/// Valores dos atalhos de cédula. As notas que mais circulam num caixa — o
/// operador que recebe uma de R$ 50 aperta uma tecla, não quatro dígitos.
const List<int> _quickAddValues = <int>[10, 20, 50, 100];

/// Coluna central da tela de Pagamento: campo do valor, parcelas (quando a
/// forma aceita), teclado numérico e as duas formas de lançar — "Receber" e
/// "Receber valor total".
class PaymentKeypad extends ConsumerWidget {
  const PaymentKeypad({required this.onReceive, super.key});

  /// Lança o pagamento em composição. Fica na página, não aqui: quem sabe o
  /// que fazer depois de receber (limpar o rascunho, avisar que faltou
  /// bandeira) é a tela, não o teclado.
  final VoidCallback onReceive;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final PaymentDraft draft = ref.watch(paymentDraftProvider);
    final PaymentSummary summary = ref.watch(paymentSummaryProvider);
    final PaymentDraftController controller = ref.read(
      paymentDraftProvider.notifier,
    );

    return SizedBox(
      width: _keypadWidth,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          _AmountRow(draft: draft),
          const SizedBox(height: _keyGap),
          _DigitGrid(
            onDigit: controller.pushDigit,
            onBackspace: controller.backspace,
            onClear: controller.clearAmount,
            onQuickAdd: (int value) => controller.addCents(value * 100),
          ),
          const SizedBox(height: _keyGap),
          _ReceiveButton(enabled: draft.canReceive, onPressed: onReceive),
          const SizedBox(height: PdvSpacing.md),
          _ReceiveTotalLink(
            remaining: summary.remainingCents,
            // Sem nada a receber (venda vazia, ou já toda paga) o atalho não
            // tem o que preencher — some, em vez de virar um botão que não
            // faz nada.
            onPressed:
                summary.remainingCents > 0
                    ? () => controller.setAmountCents(summary.remainingCents)
                    : null,
          ),
        ],
      ),
    );
  }
}

/// Campo do valor e, ao lado, o seletor de parcelas quando a forma aceita.
class _AmountRow extends ConsumerWidget {
  const _AmountRow({required this.draft});

  final PaymentDraft draft;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Sem `CrossAxisAlignment.stretch`: campo e seletor já têm altura
    // própria (`_keyHeight`), e o `stretch` aqui propagaria altura
    // **infinita** para os dois — a coluna inteira vive dentro de um
    // `SingleChildScrollView`, que não impõe teto de altura nenhum.
    return Row(
      children: <Widget>[
        Expanded(child: _AmountField(amountCents: draft.amountCents)),
        if (draft.method.supportsInstallments) ...<Widget>[
          const SizedBox(width: _keyGap),
          _InstallmentsSelect(
            value: draft.installments,
            max: draft.method.maxInstallments,
            onChanged:
                (int value) => ref
                    .read(paymentDraftProvider.notifier)
                    .setInstallments(value),
          ),
        ],
      ],
    );
  }
}

/// Mostra o valor em composição.
///
/// Não é `TextField`: o valor entra pelo teclado numérico da tela e pelas
/// teclas do teclado físico, ambos passando pelo `PaymentDraftController` —
/// um campo editável abriria um segundo caminho de escrita, com regra de
/// formatação própria, para o mesmo dado.
class _AmountField extends StatelessWidget {
  const _AmountField({required this.amountCents});

  final int amountCents;

  @override
  Widget build(BuildContext context) {
    final bool isEmpty = amountCents == 0;

    return Container(
      height: _keyHeight,
      color: PdvCounterColors.surfaceStrong,
      padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.md),
      alignment: Alignment.centerLeft,
      child: Text(
        formatCents(amountCents),
        style: PdvTypography.amountLg.copyWith(
          color:
              isEmpty
                  ? PdvCounterColors.foregroundMuted
                  : PdvCounterColors.foreground,
        ),
      ),
    );
  }
}

/// Em quantas vezes — quem define o teto é a loja
/// (`PaymentMethod.maxInstallments`), não o operador.
class _InstallmentsSelect extends StatelessWidget {
  const _InstallmentsSelect({
    required this.value,
    required this.max,
    required this.onChanged,
  });

  final int value;
  final int max;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: 'Parcelas',
      child: Container(
        height: _keyHeight,
        width: 96,
        color: PdvCounterColors.surfaceStrong,
        padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.sm),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<int>(
            key: const ValueKey<String>('payment_installments_select'),
            value: value,
            isExpanded: true,
            dropdownColor: PdvCounterColors.surfaceStrong,
            iconEnabledColor: PdvCounterColors.foregroundMuted,
            style: PdvTypography.bodyMd.copyWith(
              color: PdvCounterColors.foreground,
            ),
            items: <DropdownMenuItem<int>>[
              for (int i = 1; i <= max; i++)
                DropdownMenuItem<int>(value: i, child: Text('${i}x')),
            ],
            onChanged: (int? next) {
              if (next != null) {
                onChanged(next);
              }
            },
          ),
        ),
      ),
    );
  }
}

/// As quatro filas de teclas: dígitos à esquerda, atalho de cédula à direita.
class _DigitGrid extends StatelessWidget {
  const _DigitGrid({
    required this.onDigit,
    required this.onBackspace,
    required this.onClear,
    required this.onQuickAdd,
  });

  final ValueChanged<String> onDigit;
  final VoidCallback onBackspace;
  final VoidCallback onClear;
  final ValueChanged<int> onQuickAdd;

  /// Layout de calculadora (1 no topo), não de telefone — é o que uma
  /// maquininha de cartão usa, e é nela que a mão do operador já treinou.
  static const List<List<String>> _rows = <List<String>>[
    <String>['1', '2', '3'],
    <String>['4', '5', '6'],
    <String>['7', '8', '9'],
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      children: <Widget>[
        for (int row = 0; row < _rows.length; row++) ...<Widget>[
          if (row > 0) const SizedBox(height: _keyGap),
          Row(
            children: <Widget>[
              for (final String digit in _rows[row]) ...<Widget>[
                Expanded(
                  child: _Key(label: digit, onPressed: () => onDigit(digit)),
                ),
                const SizedBox(width: _keyGap),
              ],
              Expanded(
                child: _Key(
                  label: '+${_quickAddValues[row]}',
                  background: PdvCounterColors.keypadQuickAdd,
                  onPressed: () => onQuickAdd(_quickAddValues[row]),
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: _keyGap),
        Row(
          children: <Widget>[
            Expanded(
              child: _Key(
                icon: Icons.backspace_outlined,
                tooltip: 'Apagar último dígito',
                background: PdvCounterColors.keypadDestructive,
                onPressed: onBackspace,
              ),
            ),
            const SizedBox(width: _keyGap),
            Expanded(child: _Key(label: '0', onPressed: () => onDigit('0'))),
            const SizedBox(width: _keyGap),
            Expanded(
              child: _Key(
                label: 'C',
                tooltip: 'Limpar o valor',
                background: PdvCounterColors.keypadDestructive,
                onPressed: onClear,
              ),
            ),
            const SizedBox(width: _keyGap),
            Expanded(
              child: _Key(
                label: '+${_quickAddValues.last}',
                background: PdvCounterColors.keypadQuickAdd,
                onPressed: () => onQuickAdd(_quickAddValues.last),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _Key extends StatelessWidget {
  const _Key({
    required this.onPressed,
    this.label,
    this.icon,
    this.tooltip,
    this.background = PdvCounterColors.keypadKey,
  }) : assert(label != null || icon != null, 'Uma tecla precisa de conteúdo.');

  final String? label;
  final IconData? icon;
  final String? tooltip;
  final Color background;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final String? labelText = label;

    final Widget key = SizedBox(
      height: _keyHeight,
      child: Material(
        color: background,
        child: InkWell(
          onTap: onPressed,
          hoverColor: PdvCounterColors.surfaceHover,
          child: Center(
            child:
                labelText != null
                    ? Text(
                      labelText,
                      style: PdvTypography.headingSm.copyWith(
                        color: PdvCounterColors.foreground,
                      ),
                    )
                    : Icon(
                      icon,
                      size: PdvSizes.iconMd,
                      color: PdvCounterColors.foreground,
                    ),
          ),
        ),
      ),
    );

    final String? message = tooltip;
    return message == null ? key : Tooltip(message: message, child: key);
  }
}

/// Lança o pagamento em composição.
///
/// Desabilitado enquanto falta bandeira ou o valor é zero — e desabilitado
/// **visualmente**, não só sem ação: um botão que aceita o toque e não faz
/// nada faz o operador tocar de novo.
class _ReceiveButton extends StatelessWidget {
  const _ReceiveButton({required this.enabled, required this.onPressed});

  final bool enabled;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: _keyHeight,
      child: Material(
        color:
            enabled ? PdvCounterColors.accent : PdvCounterColors.surfaceStrong,
        child: InkWell(
          onTap: enabled ? onPressed : null,
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: <Widget>[
                Text(
                  'RECEBER',
                  style: PdvTypography.label.copyWith(
                    color:
                        enabled
                            ? PdvColors.onBrand
                            : PdvCounterColors.foregroundMuted,
                  ),
                ),
                const SizedBox(width: PdvSpacing.xs),
                Text(
                  '(ENTER)',
                  style: PdvTypography.caption.copyWith(
                    color:
                        enabled
                            ? PdvColors.onBrand
                            : PdvCounterColors.foregroundMuted,
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

/// Preenche o campo com tudo o que falta receber — o caminho de um toque para
/// o caso mais comum: o cliente paga o valor cheio numa forma só.
class _ReceiveTotalLink extends StatelessWidget {
  const _ReceiveTotalLink({required this.remaining, required this.onPressed});

  final int remaining;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    if (onPressed == null) {
      return const SizedBox.shrink();
    }

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: PdvSpacing.sm),
          // `Flexible` + reticências, e não uma largura calibrada no olho:
          // o rótulo carrega um valor de tamanho variável (R$ 9,90 e
          // R$ 1.284,90 não medem o mesmo), e uma coluna larga o bastante
          // para o pior caso desperdiçaria espaço em todos os outros.
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: <Widget>[
              Flexible(
                child: Text(
                  'RECEBER VALOR TOTAL '
                  '(${formatCents(remaining)})',
                  style: PdvTypography.labelSm.copyWith(
                    color: PdvCounterColors.accentMuted,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              const SizedBox(width: PdvSpacing.xs),
              Text(
                '(INSERT)',
                style: PdvTypography.caption.copyWith(
                  color: PdvCounterColors.foregroundMuted,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
