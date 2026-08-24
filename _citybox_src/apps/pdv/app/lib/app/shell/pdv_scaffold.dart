import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_app_bar.dart';
import 'package:citybox_pdv/app/shell/pdv_back.dart';
import 'package:citybox_pdv/app/shell/pdv_menu_drawer.dart';
import 'package:citybox_pdv/app/shell/pdv_title_bar.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

/// Moldura de qualquer tela do PDV.
///
/// Empilha, de cima para baixo:
///
/// 1. **Barra de título** — pertence à janela: relógio, tela ativa e saúde dos
///    canais. Só no desktop; no Android não há janela para decorar.
/// 2. **Barra de ações** — pertence ao app. Por padrão é `PdvAppBar` (menu,
///    voltar, sair); uma tela com controles próprios — como o Balcão — passa
///    [appBar] e substitui a padrão por inteiro. O botão de menu dela abre o
///    `PdvMenuDrawer`, à esquerda.
/// 3. O conteúdo da tela, com `PdvSpacing.contentPadding`.
///
/// Use este widget no lugar de `Scaffold` — assim uma tela nova não precisa
/// saber que as barras existem, nem repetir a checagem de plataforma ou a
/// margem de conteúdo.
class PdvScaffold extends ConsumerWidget {
  const PdvScaffold({
    required this.body,
    this.appBar,
    this.showBack = true,
    this.contentPadding = PdvSpacing.contentPadding,
    super.key,
  }) : assert(
         appBar == null || showBack,
         'showBack não tem efeito com uma app bar própria — o Voltar dela é '
         'responsabilidade da própria barra.',
       );

  final Widget body;

  /// Substitui a app bar padrão. `null` usa `PdvAppBar`.
  final Widget? appBar;

  /// Desenha o **Voltar** na app bar padrão.
  ///
  /// O padrão é `true`, e não `false`: tela sem saída é defeito, então o
  /// caminho preguiçoso — não passar nada — tem que ser o caminho correto.
  /// Só a tela inicial passa `false`, por ser a raiz. Ignorado quando [appBar]
  /// é informada.
  final bool showBack;

  /// Respiro ao redor de [body]. Telas operacionais que precisam ir até a
  /// borda — como o Balcão, com sua própria barra de ferramentas encostada
  /// no topo — passam `EdgeInsets.zero`.
  final EdgeInsets contentPadding;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bool showTitleBar = ref.watch(showCustomTitleBarProvider);

    return Scaffold(
      appBar: showTitleBar ? const PdvTitleBar() : null,
      drawer: appBar == null ? const PdvMenuDrawer() : null,
      body: SafeArea(
        // `Builder` para o botão de menu enxergar o `Scaffold` acima dele: o
        // contexto do `build` desta classe está **fora** do Scaffold, e
        // `Scaffold.of` com ele lançaria.
        child: Builder(
          builder: (BuildContext innerContext) {
            return Column(
              children: <Widget>[
                appBar ??
                    PdvAppBar(
                      onBackPressed:
                          showBack ? () => popOrHome(innerContext) : null,
                      onMenuPressed:
                          () => Scaffold.of(innerContext).openDrawer(),
                    ),
                Expanded(child: Padding(padding: contentPadding, child: body)),
              ],
            );
          },
        ),
      ),
    );
  }
}
