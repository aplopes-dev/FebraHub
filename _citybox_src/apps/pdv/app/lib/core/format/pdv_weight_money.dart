/// Converte peso × preço/kg para centavos com half-up (*.5 sobe).
int roundHalfUpToCents(num raw) {
  if (raw.isNaN || raw.isInfinite) {
    return 0;
  }
  final double value = raw.toDouble();
  if (value >= 0) {
    return (value + 0.5).floor();
  }
  return (value - 0.5).ceil();
}

/// `pricePerKgCents * weightKg` → centavos inteiros.
int weightLineCents({required int pricePerKgCents, required double weightKg}) {
  if (weightKg <= 0 || pricePerKgCents < 0) {
    return 0;
  }
  return roundHalfUpToCents(pricePerKgCents * weightKg);
}
