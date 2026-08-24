import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/brazilian_masks.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_document_type_controller.dart';
import 'package:citybox_pdv/features/counter/application/invoice_document_controller.dart';

/// Linha do documento na nota: o campo ocupa a linha inteira e o rótulo é o
/// próprio placeholder; ao lado, o atalho que troca CPF ↔ CNPJ.
///
/// Compartilhado entre o painel de totais do Balcão e o resumo da tela de
/// Pagamento — é o **mesmo** campo nas duas ([invoiceDocumentProvider]).
class CounterDocumentRow extends ConsumerStatefulWidget {
  const CounterDocumentRow({super.key});

  @override
  ConsumerState<CounterDocumentRow> createState() => _CounterDocumentRowState();
}

class _CounterDocumentRowState extends ConsumerState<CounterDocumentRow> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _syncFromProvider(String digits, CounterDocumentType type) {
    final String display = formatCpfOrCnpj(
      digits,
      isCpf: type == CounterDocumentType.cpf,
    );
    if (_controller.text != display) {
      _controller.value = TextEditingValue(
        text: display,
        selection: TextSelection.collapsed(offset: display.length),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final CounterDocumentType docType = ref.watch(counterDocumentTypeProvider);
    final String digits = ref.watch(invoiceDocumentProvider);
    final bool isCpf = docType == CounterDocumentType.cpf;

    _syncFromProvider(digits, docType);

    return ColoredBox(
      color: PdvCounterColors.surfaceStrong,
      child: SizedBox(
        height: PdvSizes.controlHeightSm,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Expanded(
              child: TextField(
                key: ValueKey<CounterDocumentType>(docType),
                controller: _controller,
                expands: true,
                maxLines: null,
                minLines: null,
                textAlignVertical: TextAlignVertical.center,
                keyboardType: TextInputType.number,
                inputFormatters: <TextInputFormatter>[
                  isCpf ? cpfMaskFormatter : cnpjMaskFormatter,
                ],
                onChanged: (String value) {
                  ref
                      .read(invoiceDocumentProvider.notifier)
                      .setDigits(value, type: docType);
                },
                style: PdvTypography.bodyMd.copyWith(
                  color: PdvCounterColors.foreground,
                ),
                decoration: InputDecoration(
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  disabledBorder: InputBorder.none,
                  isDense: true,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: PdvSpacing.md,
                  ),
                  hintText: '${isCpf ? 'CPF' : 'CNPJ'} na nota (F6)',
                  hintStyle: PdvTypography.bodyMd.copyWith(
                    color: PdvCounterColors.foregroundMuted,
                  ),
                ),
              ),
            ),
            _DocumentTypeToggle(
              label: isCpf ? 'CNPJ' : 'CPF',
              onPressed: () {
                ref.read(invoiceDocumentProvider.notifier).clear();
                ref.read(counterDocumentTypeProvider.notifier).toggle();
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _DocumentTypeToggle extends StatelessWidget {
  const _DocumentTypeToggle({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    const Color color = PdvCounterColors.accentMuted;

    return Tooltip(
      message: 'Lançar $label na nota',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.md),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                Text(
                  label,
                  style: PdvTypography.labelSm.copyWith(color: color),
                ),
                const SizedBox(width: PdvSpacing.xxs),
                Icon(Icons.swap_horiz, size: PdvSizes.iconSm, color: color),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
