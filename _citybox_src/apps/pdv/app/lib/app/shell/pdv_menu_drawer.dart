import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/home/data/home_actions.dart';
import 'package:citybox_pdv/features/home/domain/home_action.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_set_snapshot.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';

/// Menu lateral, aberto pelo botão de menu da app bar padrão.
///
/// Os itens saem de **`homeActions`**, o mesmo catálogo da tela inicial, e o
/// toque cai em **`handleHomeAction`**, o mesmo despacho dos blocos e dos
/// atalhos de teclado. Uma lista própria aqui divergiria da Home no primeiro
/// item novo — e o operador que aprendeu pelo menu passaria a discordar do
/// que a Home faz.
///
/// Segue a mesma visibilidade de módulos: o que está desligado no ERP não
/// aparece no menu, como não aparece na grade.
///
/// No rodapé ficam **Bloquear** e **Trocar operador** — e não "Sair". Nenhuma
/// das duas fecha o caixa: fechar turno é operação de dinheiro e tem tela
/// própria (ver `AGENTS.md` §4.7.2).
class PdvMenuDrawer extends ConsumerWidget {
  const PdvMenuDrawer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ModuleSetSnapshot modules = ref.watch(moduleVisibilityProvider);
    final String terminalLabel =
        ref.watch(terminalSettingsProvider).terminalLabel;
    final PosOperator? operator = ref.watch(operatorSessionProvider);

    final List<HomeAction> visible =
        homeActions
            .where(
              (HomeAction action) => modules.isOperationallyVisible(action.id),
            )
            .toList();

    return Drawer(
      backgroundColor: PdvColors.surface,
      shape: const RoundedRectangleBorder(),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            _DrawerHeader(terminalLabel: terminalLabel, operator: operator),
            const Divider(height: 1, color: PdvColors.border),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: PdvSpacing.sm),
                children: <Widget>[
                  for (final HomeAction action in visible)
                    _MenuItem(
                      action: action,
                      onPressed: () {
                        // Fecha antes de navegar: a rota nova sobe por cima e
                        // o drawer ficaria aberto atrás dela, reaparecendo no
                        // Voltar.
                        Navigator.of(context).pop();
                        handleHomeAction(context, ref, action);
                      },
                    ),
                ],
              ),
            ),
            if (operator != null) ...<Widget>[
              const Divider(height: 1, color: PdvColors.border),
              _SessionAction(
                icon: Icons.lock_outline,
                label: 'Bloquear',
                // Turno e carrinho ficam onde estão; volta com o PIN de quem
                // bloqueou.
                onPressed: () {
                  Navigator.of(context).pop();
                  ref.read(operatorLockedProvider.notifier).lock();
                },
              ),
              _SessionAction(
                icon: Icons.switch_account_outlined,
                label: 'Trocar operador',
                // O turno **continua aberto**: as vendas seguintes é que mudam
                // de dono. Não é logout.
                onPressed: () {
                  Navigator.of(context).pop();
                  ref.read(operatorSessionProvider.notifier).switchOperator();
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SessionAction extends StatelessWidget {
  const _SessionAction({
    required this.icon,
    required this.label,
    required this.onPressed,
  });

  final IconData icon;
  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        child: SizedBox(
          height: PdvSizes.controlHeight,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.xl),
            child: Row(
              children: <Widget>[
                Icon(
                  icon,
                  size: PdvSizes.iconMd,
                  color: PdvColors.textSecondary,
                ),
                const SizedBox(width: PdvSpacing.lg),
                Expanded(
                  child: Text(
                    label,
                    style: PdvTypography.bodyLg.copyWith(
                      color: PdvColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
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

class _DrawerHeader extends StatelessWidget {
  const _DrawerHeader({required this.terminalLabel, this.operator});

  final String terminalLabel;
  final PosOperator? operator;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(PdvSpacing.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(
            'Citybox PDV',
            style: PdvTypography.headingMd.copyWith(
              color: PdvColors.textPrimary,
            ),
          ),
          const SizedBox(height: PdvSpacing.xxs),
          Text(
            // Quem está operando aparece aqui: é a resposta para "sou eu
            // mesmo que estou logado?" antes de vender em nome de outro.
            operator == null
                ? terminalLabel
                : '$terminalLabel · ${operator!.name}',
            style: PdvTypography.bodySm.copyWith(
              color: PdvColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }
}

/// Item do menu: ícone na cor da ação, rótulo e a tecla de atalho.
///
/// O atalho vem escrito ao lado porque é assim que o operador migra do mouse
/// para o teclado — vendo a tecla enquanto ainda clica. Escondê-lo num tooltip
/// só ensina quem já sabe.
class _MenuItem extends StatelessWidget {
  const _MenuItem({required this.action, required this.onPressed});

  final HomeAction action;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        hoverColor: PdvAppBarColors.hover,
        child: SizedBox(
          height: PdvSizes.controlHeight,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.xl),
            child: Row(
              children: <Widget>[
                Icon(action.icon, size: PdvSizes.iconMd, color: action.color),
                const SizedBox(width: PdvSpacing.lg),
                Expanded(
                  child: Text(
                    action.label,
                    style: PdvTypography.bodyLg.copyWith(
                      color: PdvColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
                const SizedBox(width: PdvSpacing.sm),
                Text(
                  '(${action.shortcutLabel})',
                  style: PdvTypography.caption.copyWith(
                    color: PdvColors.textDisabled,
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
