import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/counter/domain/barcode_resolve.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/product_variant.dart';

/// Itens lançados na venda em curso.
final NotifierProvider<CounterCartController, List<CounterCartLine>>
counterCartProvider =
    NotifierProvider<CounterCartController, List<CounterCartLine>>(
      CounterCartController.new,
    );

final NotifierProvider<PendingQtyController, int?> counterPendingQtyProvider =
    NotifierProvider<PendingQtyController, int?>(PendingQtyController.new);

final NotifierProvider<BarcodeErrorController, String?>
counterBarcodeErrorProvider = NotifierProvider<BarcodeErrorController, String?>(
  BarcodeErrorController.new,
);

class PendingQtyController extends Notifier<int?> {
  @override
  int? build() => null;

  void setQty(int quantity) {
    if (quantity < 1 || quantity > 999) {
      return;
    }
    state = quantity;
  }

  void clear() => state = null;
}

class BarcodeErrorController extends Notifier<String?> {
  @override
  String? build() => null;

  void setError(String? message) => state = message;

  void clear() => state = null;
}

/// Resultado de [CounterCartController.submitBarcode].
enum BarcodeSubmitResult {
  added,
  needsVariant,
  needsWeight,
  notFound,
  blockedByPendingQty,
}

class CounterCartController extends Notifier<List<CounterCartLine>> {
  @override
  List<CounterCartLine> build() => const <CounterCartLine>[];

  /// Lança um produto na venda.
  ///
  /// Se o produto já está numa linha, soma 1 na quantidade dela — nunca duas
  /// linhas para o mesmo produto. É o mesmo gesto de tocar o produto de novo
  /// na grade.
  ///
  /// Estoque insuficiente **não** bloqueia (saldo pode ficar negativo no ERP).
  void addProduct(CounterProduct product) {
    addOrMergeRetailLine(CounterCartLine(product: product, quantity: 1));
  }

  /// Remove a linha do produto da venda por inteiro — diferente de reduzir a
  /// quantidade, que não tem ação própria hoje.
  void removeLine(String productId) {
    state =
        state
            .where((CounterCartLine line) => line.product.id != productId)
            .toList();
  }

  /// Atualiza quantidade e/ou desconto (percentual) de uma linha já
  /// lançada. `null` num campo mantém o valor que a linha já tinha — quem
  /// decide o que muda é a tela de edição, não este método. Valor unitário
  /// não entra aqui: vem do catálogo, esta venda não o sobrescreve.
  void updateLine(String productId, {int? quantity, double? discountPercent}) {
    state = <CounterCartLine>[
      for (final CounterCartLine line in state)
        if (line.product.id == productId)
          line.copyWith(quantity: quantity, discountPercent: discountPercent)
        else
          line,
    ];
  }

  void clear() => state = const <CounterCartLine>[];

  /// Substitui o carrinho inteiro (hidratação de conta de salão).
  void replaceAll(List<CounterCartLine> lines) {
    state = List<CounterCartLine>.unmodifiable(lines);
  }

  /// Lança linha já montada (addons / meia / observação / peso).
  void addLine(CounterCartLine line) {
    state = <CounterCartLine>[...state, line];
  }

  /// Merge por productId+skuId quando a linha é unitária sem extras.
  void addOrMergeRetailLine(CounterCartLine incoming) {
    if (!incoming.canMergeByScan) {
      addLine(incoming);
      return;
    }
    final int index = state.indexWhere(
      (CounterCartLine line) => line.sameMergeKey(incoming),
    );
    if (index == -1) {
      state = <CounterCartLine>[...state, incoming];
      return;
    }
    state = <CounterCartLine>[
      for (int i = 0; i < state.length; i++)
        if (i == index)
          state[i].copyWith(quantity: state[i].quantity + incoming.quantity)
        else
          state[i],
    ];
  }

  /// Resolve código e lança (ou sinaliza necessidade de grade/peso).
  BarcodeSubmitResult submitBarcode(
    String code, {
    required List<CounterProduct> products,
    required int? pendingQty,
    required void Function() clearPendingQty,
    required void Function(String?) setError,
    bool scaleEnabled = true,
  }) {
    setError(null);
    final BarcodeHit? hit = resolveBarcode(code, products);
    if (hit == null) {
      setError('Código não encontrado');
      return BarcodeSubmitResult.notFound;
    }

    final CounterProduct product = hit.product;
    final ProductVariant? variant = hit.variant;
    final int qty = pendingQty ?? 1;

    if (product.soldByWeight && scaleEnabled) {
      if (pendingQty != null) {
        setError('Limpe a quantidade antes de lançar item por peso');
        return BarcodeSubmitResult.blockedByPendingQty;
      }
      return BarcodeSubmitResult.needsWeight;
    }

    if (variant == null && product.hasVariants) {
      return BarcodeSubmitResult.needsVariant;
    }

    final int priceCents = variant?.priceCents ?? product.priceCents;
    final CounterProduct priced =
        variant == null
            ? product
            : product.copyWith(priceCents: priceCents);

    addOrMergeRetailLine(
      CounterCartLine(
        product: priced,
        quantity: qty,
        skuId: variant?.id,
        variantLabel: variant?.label,
      ),
    );
    clearPendingQty();
    return BarcodeSubmitResult.added;
  }
}
