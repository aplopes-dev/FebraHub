import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/layout/pdv_breakpoints.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/tables/data/shared_preferences_salon_store.dart';
import 'package:citybox_pdv/features/tables/domain/dining_table.dart';
import 'package:citybox_pdv/features/tables/domain/salon_account.dart';
import 'package:citybox_pdv/features/tables/domain/salon_enums.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

class TablesPage extends ConsumerWidget {
  const TablesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final SalonSnapshot snap = ref.watch(salonProvider);
    return PdvScaffold(
      // Sem app bar própria: a padrão do PdvScaffold já traz o Voltar, e o
      // nome da tela vive na barra de título (`currentPageProvider`).
      body: LayoutBuilder(
        builder: (BuildContext context, BoxConstraints constraints) {
          final PdvFormat format = PdvLayout.ofWidth(constraints.maxWidth);
          final int crossAxisCount = switch (format) {
            PdvFormat.compact => 2,
            PdvFormat.medium => 3,
            PdvFormat.expanded => 4,
          };
          if (snap.tables.isEmpty) {
            return const PdvEmptyState(
              title: 'Nenhuma mesa',
              subtitle: 'Cadastre mesas no ERP (fixture vazia).',
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.all(PdvSpacing.md),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossAxisCount,
              mainAxisSpacing: PdvSpacing.sm,
              crossAxisSpacing: PdvSpacing.sm,
              childAspectRatio: 1.4,
            ),
            itemCount: snap.tables.length,
            itemBuilder: (BuildContext context, int index) {
              final DiningTable table = snap.tables[index];
              final SalonAccount? account =
                  table.accountId == null
                      ? null
                      : ref
                          .read(salonProvider.notifier)
                          .accountById(table.accountId!);
              final DiningTableStatus status = table.statusFor(account?.status);
              return _TableTile(
                table: table,
                status: status,
                onOpen: () async {
                  final String accountId = await ref
                      .read(salonProvider.notifier)
                      .openTable(table.id);
                  if (!context.mounted) {
                    return;
                  }
                  context.go(
                    '${PdvRoutes.counter}?accountId=$accountId&returnTo=${PdvRoutes.tables}',
                  );
                },
                onTransfer:
                    account == null
                        ? null
                        : () => _showTransfer(context, ref, table),
                onJoin:
                    account == null
                        ? null
                        : () => _showJoin(context, ref, table),
                onSplit:
                    account == null || account.lines.isEmpty
                        ? null
                        : () => _showSplit(context, ref, table, account),
              );
            },
          );
        },
      ),
    );
  }

  Future<void> _showJoin(
    BuildContext context,
    WidgetRef ref,
    DiningTable from,
  ) async {
    final SalonSnapshot snap = ref.read(salonProvider);
    final List<DiningTable> others =
        snap.tables
            .where(
              (DiningTable t) =>
                  t.id != from.id &&
                  t.accountId != null &&
                  ref
                          .read(salonProvider.notifier)
                          .accountById(t.accountId!)
                          ?.isActive ==
                      true,
            )
            .toList();
    if (others.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nenhuma outra mesa aberta para juntar.')),
      );
      return;
    }
    final DiningTable? other = await showDialog<DiningTable>(
      context: context,
      builder: (BuildContext context) {
        return SimpleDialog(
          title: const Text('Juntar com'),
          children: <Widget>[
            for (final DiningTable t in others)
              SimpleDialogOption(
                onPressed: () => Navigator.pop(context, t),
                child: Text(t.label),
              ),
          ],
        );
      },
    );
    if (other?.accountId == null || from.accountId == null) {
      return;
    }
    try {
      await ref
          .read(salonProvider.notifier)
          .joinAccounts(sourceId: from.accountId!, targetId: other!.accountId!);
    } on StateError catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _showSplit(
    BuildContext context,
    WidgetRef ref,
    DiningTable table,
    SalonAccount account,
  ) async {
    final TextEditingController parts = TextEditingController(text: '2');
    final bool? ok = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Dividir ${table.label}'),
          content: TextField(
            controller: parts,
            keyboardType: TextInputType.number,
            decoration: pdvFilledDecoration(label: 'Partes iguais'),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Dividir'),
            ),
          ],
        );
      },
    );
    if (ok != true) {
      parts.dispose();
      return;
    }
    final int n = int.tryParse(parts.text) ?? 0;
    parts.dispose();
    try {
      await ref.read(salonProvider.notifier).splitEqual(account.id, n);
    } on Object catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }

  Future<void> _showTransfer(
    BuildContext context,
    WidgetRef ref,
    DiningTable from,
  ) async {
    final SalonSnapshot snap = ref.read(salonProvider);
    final List<DiningTable> free =
        snap.tables
            .where((DiningTable t) => t.id != from.id && t.accountId == null)
            .toList();
    if (free.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nenhuma mesa livre para transferir.')),
      );
      return;
    }
    final DiningTable? to = await showDialog<DiningTable>(
      context: context,
      builder: (BuildContext context) {
        return SimpleDialog(
          title: const Text('Transferir para'),
          children: <Widget>[
            for (final DiningTable t in free)
              SimpleDialogOption(
                onPressed: () => Navigator.pop(context, t),
                child: Text(t.label),
              ),
          ],
        );
      },
    );
    if (to == null) {
      return;
    }
    try {
      await ref
          .read(salonProvider.notifier)
          .transferTable(fromTableId: from.id, toTableId: to.id);
    } on StateError catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }
}

class _TableTile extends StatelessWidget {
  const _TableTile({
    required this.table,
    required this.status,
    required this.onOpen,
    this.onTransfer,
    this.onJoin,
    this.onSplit,
  });

  final DiningTable table;
  final DiningTableStatus status;
  final VoidCallback onOpen;
  final VoidCallback? onTransfer;
  final VoidCallback? onJoin;
  final VoidCallback? onSplit;

  Color get _color => switch (status) {
    DiningTableStatus.free => PdvColors.success,
    DiningTableStatus.occupied => PdvColors.warning,
    DiningTableStatus.closing => PdvColors.info,
  };

  String get _statusLabel => switch (status) {
    DiningTableStatus.free => 'Livre',
    DiningTableStatus.occupied => 'Ocupada',
    DiningTableStatus.closing => 'Fechando',
  };

  @override
  Widget build(BuildContext context) {
    return Material(
      color: PdvColors.surface,
      child: InkWell(
        onTap: onOpen,
        onLongPress: onTransfer,
        child: Padding(
          padding: const EdgeInsets.all(PdvSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(table.label, style: PdvTypography.headingSm),
                  ),
                  if (onJoin != null || onSplit != null || onTransfer != null)
                    PopupMenuButton<String>(
                      onSelected: (String value) {
                        switch (value) {
                          case 'transfer':
                            onTransfer?.call();
                          case 'join':
                            onJoin?.call();
                          case 'split':
                            onSplit?.call();
                        }
                      },
                      itemBuilder:
                          (BuildContext context) => <PopupMenuEntry<String>>[
                            if (onTransfer != null)
                              const PopupMenuItem<String>(
                                value: 'transfer',
                                child: Text('Transferir'),
                              ),
                            if (onJoin != null)
                              const PopupMenuItem<String>(
                                value: 'join',
                                child: Text('Juntar'),
                              ),
                            if (onSplit != null)
                              const PopupMenuItem<String>(
                                value: 'split',
                                child: Text('Dividir'),
                              ),
                          ],
                    ),
                ],
              ),
              const Spacer(),
              Row(
                children: <Widget>[
                  Container(width: 10, height: 10, color: _color),
                  const SizedBox(width: PdvSpacing.sm),
                  Text(_statusLabel, style: PdvTypography.bodySm),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
