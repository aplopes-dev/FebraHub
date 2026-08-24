import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/payment/application/sale_note_controller.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/sale_note_dialog.dart';

/// A observação da venda, no topo do fechamento.
///
/// **Só existe quando há observação.** Sem texto, a faixa não aparece: o
/// caminho de entrada é o botão da app bar, e uma linha permanente escrita
/// "sem observação" só gastaria a altura de que a lista de pagamentos precisa.
///
/// Fica aqui, e não abaixo do teclado, por dois motivos: o centro da tela
/// troca de conteúdo (teclado ↔ seleção de bandeira) e levaria a observação
/// junto, e este é o bloco que o operador lê de cima a baixo antes de apertar
/// Finalizar — mesmo lugar do CPF/CNPJ, que é o outro dado da venda que sai no
/// cupom.
class SaleNoteRow extends ConsumerWidget {
  const SaleNoteRow({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final String note = ref.watch(saleNoteProvider);
    if (note.isEmpty) {
      return const SizedBox.shrink();
    }

    return ColoredBox(
      color: PdvCounterColors.surfaceStrong,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Expanded(
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                // Toda a faixa reabre o diálogo: ler a observação e querer
                // corrigi-la é o mesmo gesto, e obrigar a subir até a app bar
                // para isso é caminho a mais no meio do fechamento.
                onTap: () => _edit(context, ref, note),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: PdvSpacing.md,
                    vertical: PdvSpacing.sm,
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      const Padding(
                        padding: EdgeInsets.only(top: PdvSpacing.xxs),
                        child: Icon(
                          Icons.sticky_note_2_outlined,
                          size: PdvSizes.iconSm,
                          color: PdvCounterColors.accentMuted,
                        ),
                      ),
                      const SizedBox(width: PdvSpacing.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: <Widget>[
                            Text(
                              'OBSERVAÇÃO',
                              style: PdvTypography.labelSm.copyWith(
                                color: PdvCounterColors.foregroundMuted,
                                letterSpacing: 0.4,
                              ),
                            ),
                            const SizedBox(height: PdvSpacing.xxs),
                            Text(
                              note,
                              // Teto de duas linhas: a observação é contexto,
                              // não o assunto do painel — passar disso comeria
                              // as linhas dos valores da venda. O texto
                              // completo continua no diálogo e no tooltip do
                              // botão da app bar.
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: PdvTypography.bodySm.copyWith(
                                color: PdvCounterColors.foreground,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Tooltip(
            message: 'Remover observação',
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () => ref.read(saleNoteProvider.notifier).clear(),
                child: const Padding(
                  padding: EdgeInsets.all(PdvSpacing.sm),
                  child: Icon(
                    Icons.close,
                    size: PdvSizes.iconSm,
                    color: PdvCounterColors.danger,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _edit(BuildContext context, WidgetRef ref, String note) async {
    final String? edited = await showSaleNoteDialog(context, initialNote: note);
    if (edited == null) {
      return;
    }
    ref.read(saleNoteProvider.notifier).setNote(edited);
  }
}
