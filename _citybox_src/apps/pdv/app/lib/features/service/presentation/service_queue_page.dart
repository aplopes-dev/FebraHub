import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/service/domain/service_queue_item.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';

class ServiceQueuePage extends ConsumerWidget {
  const ServiceQueuePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    ref.watch(salonProvider);
    final List<ServiceQueueItem> queue =
        ref.read(salonProvider.notifier).serviceQueue();

    return PdvScaffold(
      // Sem app bar própria: a padrão do PdvScaffold já traz o Voltar, e o
      // nome da tela vive na barra de título (`currentPageProvider`).
      body:
          queue.isEmpty
              ? const PdvEmptyState(
                title: 'Nenhum atendimento em curso',
                subtitle: 'Abra uma mesa ou comanda para começar.',
              )
              : ListView.separated(
                padding: const EdgeInsets.all(PdvSpacing.lg),
                itemCount: queue.length,
                separatorBuilder: (_, __) => const Divider(height: 1),
                itemBuilder: (BuildContext context, int index) {
                  final ServiceQueueItem item = queue[index];
                  return ListTile(
                    title: Text(item.title),
                    subtitle: Text('${item.itemCount} itens'),
                    onTap: () {
                      context.go(
                        '${PdvRoutes.counter}?accountId=${item.accountId}&returnTo=${PdvRoutes.service}',
                      );
                    },
                    trailing: TextButton(
                      onPressed: () async {
                        final bool? ok = await showDialog<bool>(
                          context: context,
                          builder: (BuildContext context) {
                            return AlertDialog(
                              title: const Text('Cancelar atendimento?'),
                              content: Text('Encerrar ${item.title}?'),
                              actions: <Widget>[
                                TextButton(
                                  onPressed:
                                      () => Navigator.pop(context, false),
                                  child: const Text('Não'),
                                ),
                                FilledButton(
                                  onPressed: () => Navigator.pop(context, true),
                                  child: const Text('Sim'),
                                ),
                              ],
                            );
                          },
                        );
                        if (ok == true) {
                          try {
                            await ref
                                .read(salonProvider.notifier)
                                .cancelAccount(item.accountId);
                          } on PdvApiException catch (error) {
                            if (!context.mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(error.message)),
                            );
                          }
                        }
                      },
                      child: const Text('Cancelar'),
                    ),
                  );
                },
              ),
    );
  }
}
