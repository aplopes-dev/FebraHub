import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/format/pdv_weight_money.dart';

void main() {
  test('half-up weight to cents', () {
    expect(weightLineCents(pricePerKgCents: 1000, weightKg: 0.333), 333);
    expect(weightLineCents(pricePerKgCents: 1000, weightKg: 0.335), 335);
    expect(weightLineCents(pricePerKgCents: 699, weightKg: 0.5), 350);
  });

  test('zero or negative weight → 0', () {
    expect(weightLineCents(pricePerKgCents: 1000, weightKg: 0), 0);
    expect(weightLineCents(pricePerKgCents: 1000, weightKg: -1), 0);
  });
}
