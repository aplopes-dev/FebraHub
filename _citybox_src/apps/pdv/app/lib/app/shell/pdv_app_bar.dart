import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';

/// Barra de ações padrão do conteúdo: Voltar e menu.
///
/// Diferente da barra de título — aquela pertence à janela e mostra o estado do
/// terminal; esta pertence ao **app** e carrega a navegação. Por isso ela
/// aparece também no Android, onde não existe barra de título.
///
/// É a app bar padrão do [PdvScaffold]. Telas com controles próprios — como o
/// Balcão — passam a delas via `PdvScaffold(appBar: ...)`, e esta nem chega a
/// montar.
///
/// **Não há "Sair" aqui.** O canto direito é do `PdvCloseShiftAction`, montado
/// pelo `PdvAppBarChrome`: dois botões de saída lado a lado, um deles fechando
/// o turno e o outro não, é convite para o operador clicar no errado no fim do
/// expediente. Encerrar a sessão volta quando houver login de verdade — e aí
/// no menu lateral, não colado no fechamento de caixa.
///
/// **Voltar mora aqui**, e não em cada tela: sem isso, toda tela que se
/// contenta com a barra padrão nasce sem saída — foi assim que Crédito,
/// Consulta de preço e Devolução viraram becos sem saída. A raiz (tela
/// inicial) é a única que passa [onBackPressed] nulo, por não ter para onde
/// voltar.
class PdvAppBar extends StatelessWidget implements PreferredSizeWidget {
  const PdvAppBar({required this.onMenuPressed, this.onBackPressed, super.key});

  final VoidCallback onMenuPressed;

  /// `null` omite o Voltar — só a tela inicial.
  final VoidCallback? onBackPressed;

  @override
  Size get preferredSize => const Size.fromHeight(PdvSizes.appBarHeight);

  @override
  Widget build(BuildContext context) {
    final VoidCallback? onBack = onBackPressed;

    return PdvAppBarChrome(
      child: Row(
        children: <Widget>[
          // Voltar antes do Menu: mesma posição do Balcão e do Pagamento, para
          // a saída ficar sempre no canto superior esquerdo, em qualquer tela.
          if (onBack != null)
            PdvAppBarButton(
              icon: Icons.chevron_left,
              label: 'Voltar',
              tooltip: 'Voltar',
              iconSize: PdvSizes.iconLg,
              onPressed: onBack,
            ),
          _BarButton(
            icon: Icons.menu,
            tooltip: 'Menu',
            semanticLabel: 'Abrir menu',
            onPressed: onMenuPressed,
          ),
        ],
      ),
    );
  }
}

/// Botão de ícone da barra padrão.
///
/// Quadrado com a altura inteira da barra: o alvo vai de borda a borda, então
/// um toque impreciso no canto ainda acerta. Botão pequeno centralizado numa
/// barra alta desperdiça área de toque que já estava paga.
///
/// Diferente de `PdvAppBarButton` (em `lib/ui/`): este não tem rótulo de
/// texto, só ícone — é o padrão das ações da barra global, que não precisam de
/// nome ao lado.
class _BarButton extends StatelessWidget {
  const _BarButton({
    required this.icon,
    required this.tooltip,
    required this.semanticLabel,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final String semanticLabel;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Semantics(
        button: true,
        label: semanticLabel,
        excludeSemantics: true,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onPressed,
            hoverColor: PdvAppBarColors.hover,
            child: SizedBox(
              width: PdvSizes.appBarHeight,
              height: PdvSizes.appBarHeight,
              child: Icon(
                icon,
                size: PdvSizes.iconLg,
                color: PdvAppBarColors.foreground,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
