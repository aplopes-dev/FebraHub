import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// Fixture **só para testes** — em runtime a lista vem de
/// `GET /v1/pos/payment-methods` via [paymentMethodsProvider].
///
/// Os `id`s são UUIDs (mesmo contrato do ERP): o `POST /v1/pos/sales` rejeita
/// `methodId` que não passe em `IsUUID`.
const List<PaymentMethod> fixturePaymentMethods = <PaymentMethod>[
  PaymentMethod(
    id: '11111111-1111-4111-8111-111111111101',
    label: 'Dinheiro',
    systemKey: 'pm-dinheiro',
  ),
  PaymentMethod(
    id: '11111111-1111-4111-8111-111111111102',
    label: 'Cartão de Crédito',
    systemKey: 'pm-cartao',
    brands: PaymentMethod.cardBrands,
    maxInstallments: 12,
  ),
  PaymentMethod(
    id: '11111111-1111-4111-8111-111111111103',
    label: 'Cartão de Débito',
    systemKey: 'pm-cartao-debito',
    brands: PaymentMethod.cardBrands,
  ),
  PaymentMethod(
    id: '11111111-1111-4111-8111-111111111104',
    label: 'PIX',
    systemKey: 'pm-pix',
  ),
  PaymentMethod(
    id: '11111111-1111-4111-8111-111111111105',
    label: 'iFOOD',
    systemKey: 'pm-ifood',
  ),
  PaymentMethod(
    id: '11111111-1111-4111-8111-111111111106',
    label: 'ANOTA AI',
    systemKey: 'pm-anota-ai',
  ),
  PaymentMethod(
    id: '11111111-1111-4111-8111-111111111107',
    label: 'CORTESIA',
    systemKey: 'pm-cortesia',
  ),
  PaymentMethod(
    id: '11111111-1111-4111-8111-111111111108',
    label: 'VALE FUNC',
    systemKey: 'pm-vale-funcionario',
  ),
];

/// @Deprecated Use [fixturePaymentMethods] em testes e o provider em runtime.
@Deprecated('Use paymentMethodsProvider / fixturePaymentMethods')
const List<PaymentMethod> paymentMethods = fixturePaymentMethods;
