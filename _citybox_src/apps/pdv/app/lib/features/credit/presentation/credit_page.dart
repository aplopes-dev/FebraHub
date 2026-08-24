import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/credit/application/credit_controller.dart';
import 'package:citybox_pdv/features/credit/domain/credit_models.dart';
import 'package:citybox_pdv/features/customer/application/customer_catalog_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';
import 'package:citybox_pdv/ui/pdv_money_field.dart';
import 'package:citybox_pdv/ui/pdv_form_section.dart';

class CreditPage extends ConsumerStatefulWidget {
  const CreditPage({super.key});

  @override
  ConsumerState<CreditPage> createState() => _CreditPageState();
}

class _CreditPageState extends ConsumerState<CreditPage> {
  final TextEditingController _searchController = TextEditingController();
  Customer? _selected;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(creditProvider.notifier).hydrate();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _receive() async {
    final Customer? customer = _selected;
    if (customer == null) {
      return;
    }
    final TextEditingController amountController = TextEditingController();
    final int? cents = await showDialog<int>(
      context: context,
      builder: (BuildContext ctx) {
        return AlertDialog(
          title: const Text('Receber pagamento'),
          content: PdvDialogBody(
            child: PdvMoneyField(
              label: 'Valor',
              controller: amountController,
              autofocus: true,
            ),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Cancelar'),
            ),
            SizedBox(
              height: PdvSizes.controlHeight,
              child: FilledButton(
                onPressed: () {
                  final int v = PdvMoneyField.centsOf(amountController);
                  Navigator.of(ctx).pop(v);
                },
                child: const Text('Confirmar'),
              ),
            ),
          ],
        );
      },
    );
    if (cents == null) {
      return;
    }
    final String? shiftId = ref.read(cashShiftProvider)?.id;
    await ref
        .read(creditProvider.notifier)
        .receivePayment(
          customerId: customer.id,
          amountCents: cents,
          cashIntoDrawer: true,
          shiftId: shiftId,
        );
    if (mounted) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Recebido ${formatCents(cents)}')));
    }
  }

  @override
  Widget build(BuildContext context) {
    final List<Customer> customers =
        ref.watch(customerCatalogProvider).items;
    final CreditState credit = ref.watch(creditProvider);
    final String q = _searchController.text.trim().toLowerCase();
    final List<Customer> filtered =
        q.isEmpty
            ? customers
            : customers.where((Customer c) => c.matches(q)).toList();

    final CustomerCreditAccount? account =
        _selected == null ? null : credit.accountFor(_selected!.id);
    final List<CreditLedgerEntry> entries =
        _selected == null
            ? const <CreditLedgerEntry>[]
            : credit.entriesFor(_selected!.id);

    return PdvScaffold(
      body: Padding(
        padding: const EdgeInsets.all(PdvSpacing.lg),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  Text('Clientes', style: PdvTypography.headingMd),
                  const SizedBox(height: PdvSpacing.md),
                  PdvFilledField(
                    label: 'Buscar',
                    controller: _searchController,
                    onSubmitted: (_) => setState(() {}),
                  ),
                  const SizedBox(height: PdvSpacing.md),
                  Expanded(
                    child: ListView.builder(
                      itemCount: filtered.length,
                      itemBuilder: (BuildContext context, int index) {
                        final Customer c = filtered[index];
                        final int bal =
                            credit.accountFor(c.id)?.balanceCents ?? 0;
                        return ListTile(
                          selected: _selected?.id == c.id,
                          title: Text(c.name, style: PdvTypography.bodyMd),
                          subtitle: Text(formatCents(bal)),
                          onTap: () => setState(() => _selected = c),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: PdvSpacing.lg),
            Expanded(
              flex: 2,
              child:
                  _selected == null
                      ? const Center(
                        child: Text(
                          'Selecione um cliente',
                          style: PdvTypography.bodyLg,
                        ),
                      )
                      : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: <Widget>[
                          PdvStatCard(
                            label: 'Saldo',
                            value: formatCents(account?.balanceCents ?? 0),
                          ),
                          const SizedBox(height: PdvSpacing.md),
                          SizedBox(
                            height: PdvSizes.controlHeightLg,
                            child: FilledButton(
                              onPressed: _receive,
                              child: const Text('Receber pagamento'),
                            ),
                          ),
                          const SizedBox(height: PdvSpacing.lg),
                          Text('Extrato', style: PdvTypography.headingMd),
                          const SizedBox(height: PdvSpacing.sm),
                          Expanded(
                            child:
                                entries.isEmpty
                                    ? const Center(
                                      child: Text(
                                        'Sem movimentos',
                                        style: PdvTypography.bodyMd,
                                      ),
                                    )
                                    : ListView.builder(
                                      itemCount: entries.length,
                                      itemBuilder: (
                                        BuildContext context,
                                        int index,
                                      ) {
                                        final CreditLedgerEntry e =
                                            entries[index];
                                        return ListTile(
                                          title: Text(
                                            e.type.name,
                                            style: PdvTypography.bodyMd,
                                          ),
                                          subtitle: Text(e.note ?? ''),
                                          trailing: Text(
                                            formatCents(e.amountCents),
                                            style: PdvTypography.amountSm,
                                          ),
                                        );
                                      },
                                    ),
                          ),
                        ],
                      ),
            ),
          ],
        ),
      ),
    );
  }
}
