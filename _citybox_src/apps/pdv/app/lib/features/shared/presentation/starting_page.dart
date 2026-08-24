import 'package:flutter/material.dart';

import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// O que o terminal mostra enquanto ainda não sabe para onde mandar o operador.
///
/// Existe por um motivo estreito: o `redirect` do router não pode decidir nada
/// antes de ler o cofre, e **a tela desenhada nesse intervalo não pode ser a
/// Home**. A Home é a tela operacional — mostrá-la antes de o app saber quem
/// está no caixa faz o PDV parecer aberto e pronto por um instante, com os
/// blocos de venda visíveis.
///
/// Deliberadamente sem ação nenhuma: sem menu, sem Voltar, sem Fechar caixa.
/// Não há nada aqui que o operador possa ou deva fazer — o intervalo é de
/// milissegundos, e qualquer botão seria um convite a tocar em algo que
/// desaparece.
///
/// A barra de título fica, e não é enfeite: no desktop a janela é desenhada
/// sem decoração do sistema (`titleBarStyle: hidden`), então é ela que oferece
/// arrastar, minimizar e fechar. Sem a barra, um boot travado deixaria a janela
/// impossível de mover ou fechar.
class StartingPage extends StatelessWidget {
  const StartingPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PdvScaffold(
      contentPadding: EdgeInsets.zero,
      appBar: PdvAppBarChrome(showCloseShift: false, child: SizedBox.shrink()),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Image(
              image: AssetImage('assets/images/logobrand.png'),
              width: 48,
              height: 48,
              filterQuality: FilterQuality.medium,
            ),
            SizedBox(height: PdvSpacing.xl),
            SizedBox(
              width: 160,
              child: LinearProgressIndicator(
                minHeight: 2,
                backgroundColor: PdvColors.surfaceMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
