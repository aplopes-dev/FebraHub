import 'package:citybox_pdv/features/counter/domain/counter_product.dart';

/// Preço meia-a-meia da fixture: **maior** das duas metades (não a média).
int halfPizzaPriceCents({
  required CounterProduct left,
  required CounterProduct right,
}) {
  return left.priceCents >= right.priceCents
      ? left.priceCents
      : right.priceCents;
}
