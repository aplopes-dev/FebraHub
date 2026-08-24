import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// Um pagamento já lançado na venda (valor em centavos).
class PaymentEntry {
  const PaymentEntry({
    required this.method,
    required this.amountCents,
    this.brand,
    this.installments = 1,
  });

  final PaymentMethod method;
  final int amountCents;
  final String? brand;
  final int installments;

  String? get detail {
    final String? brandLabel = brand;
    if (brandLabel == null) {
      return installments > 1 ? '${installments}x' : null;
    }
    return installments > 1 ? '$brandLabel — ${installments}x' : brandLabel;
  }
}
