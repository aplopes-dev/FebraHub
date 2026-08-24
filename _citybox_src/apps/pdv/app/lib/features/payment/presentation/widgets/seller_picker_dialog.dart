import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/format/normalize_for_search.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';
import 'package:citybox_pdv/ui/pdv_entity_picker_dialog.dart';

/// O que o seletor devolveu.
///
/// Existe para separar "escolheu ninguém" de "desistiu": `null` do
/// `showDialog` é o operador fechando a caixa, e um [SellerSelection] com
/// [seller] nulo é ele tirando o vendedor da venda de propósito. Sem a
/// distinção, fechar o diálogo apagaria o vendedor já escolhido.
class SellerSelection {
  const SellerSelection(this.seller);

  const SellerSelection.none() : seller = null;

  final Seller? seller;
}

/// Abre o seletor de vendedor da venda.
///
/// Mesmo shell visual do picker de clientes (`PdvEntityPickerDialog`).
Future<SellerSelection?> showSellerPickerDialog(
  BuildContext context, {
  required List<Seller> sellers,
  required Seller? selected,
}) {
  return showDialog<SellerSelection>(
    context: context,
    barrierDismissible: false,
    builder:
        (BuildContext dialogContext) =>
            _SellerPickerDialog(sellers: sellers, selected: selected),
  );
}

class _SellerPickerDialog extends StatefulWidget {
  const _SellerPickerDialog({required this.sellers, required this.selected});

  final List<Seller> sellers;
  final Seller? selected;

  @override
  State<_SellerPickerDialog> createState() => _SellerPickerDialogState();
}

class _SellerPickerDialogState extends State<_SellerPickerDialog> {
  String _query = '';

  List<Seller> get _results {
    final List<Seller> filtered =
        widget.sellers
            .where((Seller seller) => seller.matches(_query))
            .toList(growable: true);
    filtered.sort(
      (Seller a, Seller b) => compareNamesForSort(a.name, b.name),
    );
    return filtered;
  }

  void _select(Seller seller) =>
      Navigator.of(context).pop(SellerSelection(seller));

  void _close() => Navigator.of(context).pop();

  /// ENTER escolhe o primeiro resultado da busca.
  void _submit(String _) {
    final List<Seller> results = _results;
    if (results.isEmpty) {
      return;
    }
    _select(results.first);
  }

  @override
  Widget build(BuildContext context) {
    final List<Seller> results = _results;

    return PdvEntityPickerDialog(
      title: 'Vendedores',
      icon: Icons.groups_outlined,
      searchHint: 'Buscar por nome ou código',
      onSearchChanged: (String value) => setState(() => _query = value),
      onSearchSubmitted: _submit,
      onCancel: _close,
      list:
          widget.sellers.isEmpty
              ? const PdvEntityPickerEmpty(
                'Nenhum usuário vendedor nesta unidade. '
                'Marque “Usuário vendedor” em Usuários e Permissões no ERP.',
              )
              : results.isEmpty
              ? Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: <Widget>[
                  PdvEntityPickerTile(
                    label: 'Sem vendedor',
                    isSelected: widget.selected == null,
                    leading: const Icon(
                      Icons.person_off_outlined,
                      size: PdvSizes.iconMd,
                      color: PdvColors.textSecondary,
                    ),
                    onTap:
                        () => Navigator.of(context).pop(
                          const SellerSelection.none(),
                        ),
                  ),
                  const Expanded(
                    child: PdvEntityPickerEmpty('Nenhum vendedor encontrado'),
                  ),
                ],
              )
              : ListView.builder(
                padding: EdgeInsets.zero,
                // +1: "Sem vendedor" sempre no topo (como Consumidor Final).
                itemCount: results.length + 1,
                itemBuilder: (BuildContext context, int index) {
                  if (index == 0) {
                    return PdvEntityPickerTile(
                      label: 'Sem vendedor',
                      isSelected: widget.selected == null,
                      leading: const Icon(
                        Icons.person_off_outlined,
                        size: PdvSizes.iconMd,
                        color: PdvColors.textSecondary,
                      ),
                      onTap:
                          () => Navigator.of(context).pop(
                            const SellerSelection.none(),
                          ),
                    );
                  }

                  final Seller seller = results[index - 1];
                  return PdvEntityPickerTile(
                    label: seller.name,
                    isSelected: seller.id == widget.selected?.id,
                    leading: SizedBox(
                      width: _codeColumnWidth,
                      child: Text(
                        seller.code,
                        style: PdvTypography.label.copyWith(
                          color: PdvColors.textSecondary,
                          fontFeatures: PdvTypography.tabular,
                        ),
                      ),
                    ),
                    onTap: () => _select(seller),
                  );
                },
              ),
    );
  }
}

/// Largura da coluna do código — cabe "0001" sem empurrar o nome.
const double _codeColumnWidth = 56;
