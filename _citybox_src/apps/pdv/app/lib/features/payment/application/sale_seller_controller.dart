import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/payment/application/terminal_sellers_controller.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';

/// Vendedor atribuído à venda em curso. `null` = nenhum escolhido.
///
/// Default **E**: quando a lista de vendedores carrega e ainda não há
/// escolha, se o operador logado for vendedor, pré-seleciona ele. “Sem
/// vendedor” e troca manual continuam válidos; [clear] não reaplica o
/// default até a próxima venda (`resetOpenSale` + [ensureDefaultSeller]).
/// Troca de **operador** zera o vendedor e reaplica o default do novo.
final NotifierProvider<SaleSellerController, Seller?> saleSellerProvider =
    NotifierProvider<SaleSellerController, Seller?>(SaleSellerController.new);

class SaleSellerController extends Notifier<Seller?> {
  /// Depois de um [clear] explícito, não reaplicar o default nesta venda.
  bool _clearedByUser = false;

  @override
  Seller? build() {
    ref.listen<AsyncValue<List<Seller>>>(terminalSellersProvider, (
      _,
      next,
    ) {
      next.whenData((_) => ensureDefaultSeller());
    });
    // Troca de operador: o vendedor da pessoa anterior não pode ficar
    // grudado — reaplica o default do novo (ou fica sem vendedor).
    ref.listen<PosOperator?>(operatorSessionProvider, (
      PosOperator? previous,
      PosOperator? next,
    ) {
      if (previous?.id == next?.id) return;
      _clearedByUser = false;
      state = null;
      ensureDefaultSeller();
    });
    // `listen` não dispara o valor já resolvido — reaplica se sellers/
    // operador já estiverem prontos quando o provider sobe.
    Future<void>.microtask(ensureDefaultSeller);
    return null;
  }

  void select(Seller seller) {
    _clearedByUser = false;
    state = seller;
  }

  void clear() {
    _clearedByUser = true;
    state = null;
  }

  /// Reaplica o default do operador (nova venda / pós-reset).
  void prepareForNewSale() {
    _clearedByUser = false;
    state = null;
    ensureDefaultSeller();
  }

  void ensureDefaultSeller() {
    if (state != null || _clearedByUser) return;
    final PosOperator? operator = ref.read(operatorSessionProvider);
    if (operator == null) return;
    final AsyncValue<List<Seller>> sellersAsync = ref.read(
      terminalSellersProvider,
    );
    final List<Seller>? sellers = sellersAsync.valueOrNull;
    if (sellers == null || sellers.isEmpty) return;
    for (final Seller seller in sellers) {
      if (seller.id == operator.id) {
        state = seller;
        return;
      }
    }
  }
}
