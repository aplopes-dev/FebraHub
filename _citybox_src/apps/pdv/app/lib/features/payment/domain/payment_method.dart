/// Uma forma de pagamento aceita pela loja — dinheiro, cartão, PIX, etc.
///
/// O que varia entre elas não é só o nome: cartão pede **bandeira** antes do
/// valor, crédito ainda pede em **quantas parcelas**, e dinheiro não pede
/// nada. Essas três diferenças são os três campos abaixo.
///
/// [id] é o UUID da `PaymentMethod` no ERP (vai no POST da venda).
/// [systemKey] é a chave estável do seed (`pm-dinheiro`, `pm-pix`, …) — usada
/// para comportamento local (gaveta, bandeiras, fechamento de caixa).
class PaymentMethod {
  const PaymentMethod({
    required this.id,
    required this.label,
    this.systemKey,
    this.brands = const <String>[],
    this.maxInstallments = 1,
  });

  final String id;
  final String label;
  final String? systemKey;

  /// Bandeiras a escolher antes de digitar o valor (Visa, MasterCard, …).
  /// Vazia para as formas que não têm bandeira — dinheiro, PIX, cortesia.
  final List<String> brands;

  /// Teto de parcelas. 1 = à vista, sem seletor de parcelas na tela.
  final int maxInstallments;

  bool get requiresBrand => brands.isNotEmpty;

  bool get supportsInstallments => maxInstallments > 1;

  /// Meio que movimenta a gaveta (esperado em caixa).
  bool get isCash =>
      systemKey == 'pm-dinheiro' || id == 'cash' || systemKey == 'cash';

  static const List<String> cardBrands = <String>[
    'Visa',
    'MasterCard',
    'Elo',
    'American Express',
    'Hipercard',
  ];

  factory PaymentMethod.fromPosJson(Map<String, dynamic> json) {
    final String? systemKey = json['systemKey'] as String?;
    final String? installment = json['installmentPermission'] as String?;
    final bool isCredit = systemKey == 'pm-cartao';
    final bool isDebit = systemKey == 'pm-cartao-debito';
    final bool allowsInstallments =
        installment == 'allowed' || installment == 'Permitir';

    return PaymentMethod(
      id: json['id']! as String,
      label: json['name']! as String,
      systemKey: systemKey,
      brands: (isCredit || isDebit) ? cardBrands : const <String>[],
      maxInstallments: isCredit && allowsInstallments ? 12 : 1,
    );
  }

  Map<String, dynamic> toJson() => <String, dynamic>{
    'id': id,
    'name': label,
    'systemKey': systemKey,
    'installmentPermission': maxInstallments > 1 ? 'allowed' : null,
  };
}
