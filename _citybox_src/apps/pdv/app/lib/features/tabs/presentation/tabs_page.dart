import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

class TabsPage extends ConsumerStatefulWidget {
  const TabsPage({super.key});

  @override
  ConsumerState<TabsPage> createState() => _TabsPageState();
}

class _TabsPageState extends ConsumerState<TabsPage> {
  final TextEditingController _numberController = TextEditingController();
  final TextEditingController _cardController = TextEditingController();

  @override
  void dispose() {
    _numberController.dispose();
    _cardController.dispose();
    super.dispose();
  }

  Future<void> _open() async {
    try {
      final String accountId = await ref
          .read(salonProvider.notifier)
          .openTab(number: _numberController.text, card: _cardController.text);
      if (!mounted) {
        return;
      }
      context.go(
        '${PdvRoutes.counter}?accountId=$accountId&returnTo=${PdvRoutes.tabs}',
      );
    } on ArgumentError catch (e) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message?.toString() ?? 'Dados inválidos')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final SalonSnapshot snap = ref.watch(salonProvider);
    final List<SalonAccount> openTabs =
        snap.accounts
            .where(
              (SalonAccount a) =>
                  a.isActive &&
                  (a.tabNumber != null ||
                      a.tabCard != null ||
                      a.origin.name == 'tab'),
            )
            .toList();

    return PdvScaffold(
      // Sem app bar própria: a padrão do PdvScaffold já traz o Voltar, e o
      // nome da tela vive na barra de título (`currentPageProvider`).
      body: ListView(
        padding: const EdgeInsets.all(PdvSpacing.lg),
        children: <Widget>[
          PdvFilledField(
            label: 'Número',
            controller: _numberController,
            keyboardType: TextInputType.number,
            onSubmitted: (_) => _open(),
          ),
          const SizedBox(height: PdvSpacing.md),
          PdvFilledField(
            label: 'Cartão',
            controller: _cardController,
            onSubmitted: (_) => _open(),
          ),
          const SizedBox(height: PdvSpacing.lg),
          FilledButton(onPressed: _open, child: const Text('Abrir / retomar')),
          const SizedBox(height: PdvSpacing.xl),
          Text('Abertas', style: PdvTypography.headingSm),
          const SizedBox(height: PdvSpacing.sm),
          if (openTabs.isEmpty)
            const PdvEmptyState(
              title: 'Nenhuma comanda aberta',
              subtitle: 'Informe número ou cartão acima.',
            )
          else
            ...openTabs.map((SalonAccount a) {
              final String label =
                  a.tabNumber != null
                      ? 'Comanda ${a.tabNumber}'
                      : 'Cartão ${a.tabCard}';
              return ListTile(
                title: Text(label),
                subtitle: Text('${a.lines.length} itens'),
                onTap: () {
                  context.go(
                    '${PdvRoutes.counter}?accountId=${a.id}&returnTo=${PdvRoutes.tabs}',
                  );
                },
                trailing: TextButton(
                  onPressed: () async {
                    await ref.read(salonProvider.notifier).beginClose(a.id);
                    if (!context.mounted) {
                      return;
                    }
                    context.go(
                      '${PdvRoutes.payment}?accountId=${a.id}&returnTo=${PdvRoutes.tabs}',
                    );
                  },
                  child: const Text('Fechar'),
                ),
              );
            }),
        ],
      ),
    );
  }
}
