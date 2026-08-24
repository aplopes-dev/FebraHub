import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Botão de app bar com ícone e, opcionalmente, rótulo de texto.
///
/// Diferente do botão só-ícone da app bar padrão (quadrado, mesma largura da
/// altura): este tem largura de conteúdo, para nomes como "Consumidor Final —
/// Padrão" ou o nome da loja caberem. Usado nas app bars de tela — Balcão e
/// Pagamento —, e qualquer tela com controle próprio na app bar reaproveita
/// daqui em vez de duplicar o `InkWell`+`Row`.
///
/// Sem [label] o botão fica só com o ícone — o caso das ações secundárias
/// (vendedor, observação, configurações na tela de Pagamento). Nesse formato
/// [tooltip] é obrigatório: um ícone sozinho, sem nome ao passar o mouse, é
/// um botão que só quem já sabe o que ele faz consegue usar.
class PdvAppBarButton extends StatelessWidget {
  const PdvAppBarButton({
    required this.icon,
    required this.onPressed,
    this.label,
    this.secondaryLabel,
    this.tooltip,
    this.iconSize = PdvSizes.iconMd,
    this.horizontalPadding = PdvSpacing.md,
    this.maxLabelWidth = 480,
    super.key,
  }) : assert(
         label != null || tooltip != null,
         'Um botão só-ícone precisa de tooltip: sem rótulo nem tooltip, '
         'nada nomeia a ação.',
       ),
       assert(
         secondaryLabel == null || label != null,
         'secondaryLabel é a segunda linha de um rótulo: sem label não há '
         'primeira linha para ele acompanhar.',
       );

  final IconData icon;

  /// `null` desenha só o ícone.
  final String? label;

  /// Segunda linha, abaixo de [label], em texto menor e apagado.
  ///
  /// Existe para o atalho de teclado do botão ("(SHIFT + ESC)") ficar visível
  /// na barra, e não só no tooltip: num caixa, o operador aprende o atalho
  /// vendo-o na tela enquanto usa o mouse — se ele só aparece ao pousar o
  /// ponteiro, quem já está com a mão no mouse nunca migra para o teclado.
  final String? secondaryLabel;

  /// Texto do tooltip. Sem ele, cai no [label].
  final String? tooltip;
  final VoidCallback onPressed;

  /// Tamanho do ícone. Sobe para o Voltar — o botão de saída mais usado da
  /// tela ganha o alvo mais generoso, não só o mesmo dos demais.
  final double iconSize;

  /// Respiro horizontal de cada lado do conteúdo. Sobe junto com [iconSize]
  /// pelo mesmo motivo: mais área de toque para quem sai da venda.
  final double horizontalPadding;

  /// Teto de largura do rótulo, antes de cortar com reticências.
  ///
  /// 480 cobre com folga o rótulo padrão do cliente em `PdvTypography.label`
  /// ampliado (desktop). Ainda existe um teto, e não largura livre: um nome
  /// de cliente real, muito mais longo que o padrão, precisa continuar
  /// cabendo na barra em vez de empurrar os botões à direita para fora.
  final double maxLabelWidth;

  @override
  Widget build(BuildContext context) {
    final String? labelText = label;

    return Tooltip(
      message: tooltip ?? labelText ?? '',
      // Altura travada em `appBarHeight`: sem isso, o `Row` interno
      // (`mainAxisSize: min`) só ocupa a altura do próprio conteúdo, e o
      // `InkWell` por trás herda esse tamanho — o hover vira uma tira fina no
      // meio da barra em vez de cobrir a barra inteira, de cima a baixo.
      child: SizedBox(
        height: PdvSizes.appBarHeight,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            hoverColor: PdvAppBarColors.hover,
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: horizontalPadding),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Icon(icon, size: iconSize, color: PdvAppBarColors.foreground),
                  if (labelText != null) ...<Widget>[
                    const SizedBox(width: PdvSpacing.xs),
                    ConstrainedBox(
                      constraints: BoxConstraints(maxWidth: maxLabelWidth),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: <Widget>[
                          Text(
                            // Maiúsculas: convenção da app bar de tela —
                            // reforça a hierarquia entre a barra de ações e o
                            // corpo, que segue em texto normal.
                            labelText.toUpperCase(),
                            style: PdvTypography.label.copyWith(
                              color: PdvAppBarColors.foreground,
                            ),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                          if (secondaryLabel != null)
                            Text(
                              secondaryLabel!.toUpperCase(),
                              style: PdvTypography.caption.copyWith(
                                color: PdvColors.textDisabled,
                              ),
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
