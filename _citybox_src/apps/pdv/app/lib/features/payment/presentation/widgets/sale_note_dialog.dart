import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// Abre o diálogo da observação da venda.
///
/// Devolve o texto a gravar — string vazia quando o operador **remove** a
/// observação — ou `null` quando ele fecha sem confirmar. São três desfechos
/// diferentes, e por isso "remover" não é `null`: apagar uma observação é uma
/// decisão, desistir do diálogo não é.
Future<String?> showSaleNoteDialog(
  BuildContext context, {
  required String initialNote,
}) {
  return showDialog<String>(
    context: context,
    builder:
        (BuildContext dialogContext) =>
            _SaleNoteDialog(initialNote: initialNote),
  );
}

class _SaleNoteDialog extends StatefulWidget {
  const _SaleNoteDialog({required this.initialNote});

  final String initialNote;

  @override
  State<_SaleNoteDialog> createState() => _SaleNoteDialogState();
}

class _SaleNoteDialogState extends State<_SaleNoteDialog> {
  late final TextEditingController _controller = TextEditingController(
    text: widget.initialNote,
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Observação da venda'),
      content: PdvDialogBody(
        child: TextField(
          controller: _controller,
          autofocus: true,
          // Multilinha: a observação é frase ("Entregar após as 18h"), não
          // rótulo. Sem `newline` como ação, ENTER quebraria a linha e o
          // operador não teria como confirmar pelo teclado.
          minLines: 4,
          maxLines: 6,
          maxLength: _maxNoteLength,
          textCapitalization: TextCapitalization.sentences,
          style: PdvTypography.bodyLg.copyWith(color: PdvColors.textPrimary),
          decoration: pdvFilledDecoration(
            label: 'Observação',
            hintText: 'Ex.: entregar após as 18h, cliente pediu nota separada',
          ),
        ),
      ),
      actions: <Widget>[
        if (widget.initialNote.isNotEmpty)
          TextButton(
            onPressed: () => Navigator.of(context).pop(''),
            child: const Text('Remover'),
          ),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(_controller.text),
          child: const Text('Salvar'),
        ),
      ],
    );
  }
}

/// Teto do texto. Não é regra fiscal — é o que cabe no cupom sem virar carta;
/// revisitar quando a emissão de verdade entrar e disser o limite real.
const int _maxNoteLength = 240;
