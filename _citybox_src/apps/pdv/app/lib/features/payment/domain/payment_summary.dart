/// Fechamento financeiro da tela de Pagamento (centavos).
class PaymentSummary {
  const PaymentSummary({required this.totalCents, required this.receivedCents});

  final int totalCents;
  final int receivedCents;

  int get remainingCents {
    final int left = totalCents - receivedCents;
    return left > 0 ? left : 0;
  }

  int get changeCents {
    final int over = receivedCents - totalCents;
    return over > 0 ? over : 0;
  }

  bool get canFinalize => totalCents > 0 && receivedCents >= totalCents;
}
