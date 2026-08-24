import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_page_title.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/customer/application/customer_catalog_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_form_result.dart';
import 'package:citybox_pdv/features/customer/presentation/customer_form_page.dart';
import 'package:citybox_pdv/ui/pdv_entity_picker_dialog.dart';

/// O que o seletor de clientes devolveu.
///
/// Existe para separar "escolheu ninguém" de "desistiu": `null` do
/// `showDialog` é o operador fechando a caixa, e um [CustomerSelection] com
/// [customer] nulo é ele voltando ao consumidor final de propósito.
class CustomerSelection {
  const CustomerSelection(this.customer);

  const CustomerSelection.none() : customer = null;

  final Customer? customer;
}

/// Abre o seletor de clientes da venda.
///
/// Não fecha ao clicar fora (`barrierDismissible: false`) — só Cancelar / X.
Future<CustomerSelection?> showCustomerPickerDialog(
  BuildContext context, {
  required Customer? selected,
}) {
  return showDialog<CustomerSelection>(
    context: context,
    barrierDismissible: false,
    builder:
        (BuildContext dialogContext) =>
            CustomerPickerDialog(selected: selected),
  );
}

/// Diálogo de busca e lista de clientes.
class CustomerPickerDialog extends ConsumerStatefulWidget {
  const CustomerPickerDialog({required this.selected, super.key});

  final Customer? selected;

  @override
  ConsumerState<CustomerPickerDialog> createState() =>
      _CustomerPickerDialogState();
}

class _CustomerPickerDialogState extends ConsumerState<CustomerPickerDialog> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final CustomerCatalogController catalog =
          ref.read(customerCatalogProvider.notifier);
      if (!ref.read(customerCatalogProvider).hydrated) {
        unawaited(catalog.hydrate());
      } else {
        unawaited(catalog.search(''));
      }
    });
  }

  void _select(Customer customer) =>
      Navigator.of(context).pop(CustomerSelection(customer));

  void _close() => Navigator.of(context).pop();

  Future<void> _openForm({Customer? existing}) async {
    final CustomerFormResult? result =
        await pushWithPageTitle<CustomerFormResult>(
          context,
          ref,
          title: existing == null ? 'Cadastrar cliente' : 'Consultar cliente',
          builder: (_) => CustomerFormPage(initial: existing),
        );
    if (!mounted || result == null) {
      return;
    }

    if (result.select) {
      Navigator.of(context).pop(CustomerSelection(result.customer));
    }
  }

  @override
  Widget build(BuildContext context) {
    final CustomerCatalogState catalog = ref.watch(customerCatalogProvider);
    final List<Customer> results = catalog.items;

    return PdvEntityPickerDialog(
      title: 'Clientes',
      icon: Icons.people,
      searchHint: 'Buscar',
      loading: catalog.loading,
      onSearchChanged: (String value) {
        ref.read(customerCatalogProvider.notifier).searchDebounced(value);
      },
      onCancel: _close,
      primaryAction: PdvEntityPickerPrimaryAction(
        label: 'NOVO CLIENTE (INSERT)',
        leading: const Icon(Icons.add),
        onPressed: () => unawaited(_openForm()),
      ),
      extraShortcuts: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.insert):
            () => unawaited(_openForm()),
      },
      list:
          results.isEmpty && !catalog.loading
              ? const PdvEntityPickerEmpty('Nenhum cliente encontrado')
              : ListView.builder(
                padding: EdgeInsets.zero,
                itemCount: results.length + 1,
                itemBuilder: (BuildContext context, int index) {
                  if (index == 0) {
                    // Sempre o primeiro — fora da ordem alfabética.
                    return PdvEntityPickerTile(
                      label: CounterCustomerController.defaultCustomerLabel,
                      isSelected: widget.selected == null,
                      leading: const Icon(
                        Icons.people_outline,
                        size: PdvSizes.iconMd,
                        color: PdvColors.textSecondary,
                      ),
                      onTap:
                          () => Navigator.of(context).pop(
                            const CustomerSelection.none(),
                          ),
                    );
                  }

                  final Customer customer = results[index - 1];
                  return PdvEntityPickerTile(
                    label: customer.name,
                    isSelected: customer.id == widget.selected?.id,
                    leading: const Icon(
                      Icons.people_outline,
                      size: PdvSizes.iconMd,
                      color: PdvColors.textSecondary,
                    ),
                    onTap: () => _select(customer),
                    trailing: Tooltip(
                      message: 'Consultar cliente',
                      child: InkWell(
                        onTap:
                            () => unawaited(_openForm(existing: customer)),
                        child: SizedBox(
                          width: PdvSizes.controlHeight,
                          child: Center(
                            child: Icon(
                              Icons.edit,
                              size: PdvSizes.iconMd,
                              color: PdvColors.focusRing,
                            ),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
    );
  }
}
