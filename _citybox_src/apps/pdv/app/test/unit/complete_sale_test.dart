import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/counter/application/counter_document_type_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/domain/counter_totals.dart';
import 'package:citybox_pdv/features/counter/domain/sale_adjustment.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/payment/application/complete_sale.dart';
import 'package:citybox_pdv/features/payment/domain/payment_entry.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

void main() {
  group('PaymentMethod.fromPosJson', () {
    test('mapeia dinheiro sem bandeira', () {
      final PaymentMethod method = PaymentMethod.fromPosJson(<String, dynamic>{
        'id': 'uuid-cash',
        'name': 'Dinheiro',
        'systemKey': 'pm-dinheiro',
        'fiscalCode': '01',
        'installmentPermission': null,
      });
      expect(method.id, 'uuid-cash');
      expect(method.isCash, isTrue);
      expect(method.brands, isEmpty);
      expect(method.maxInstallments, 1);
    });

    test('crédito com parcelas allowed → teto 12', () {
      final PaymentMethod method = PaymentMethod.fromPosJson(<String, dynamic>{
        'id': 'uuid-credit',
        'name': 'Cartão de Crédito',
        'systemKey': 'pm-cartao',
        'installmentPermission': 'allowed',
      });
      expect(method.requiresBrand, isTrue);
      expect(method.maxInstallments, 12);
    });
  });

  group('buildPosSaleBody', () {
    const CounterProduct product = CounterProduct(
      id: 'prod-1',
      name: 'Item',
      priceCents: 1000,
      categoryId: 'cat',
    );
    const PaymentMethod cash = PaymentMethod(
      id: 'uuid-cash',
      label: 'Dinheiro',
      systemKey: 'pm-dinheiro',
    );
    const PaymentMethod pix = PaymentMethod(
      id: 'uuid-pix',
      label: 'PIX',
      systemKey: 'pm-pix',
    );

    test('monta lines/payments e consumerDocument', () {
      final Map<String, dynamic> body = buildPosSaleBody(
        operatorId: 'op-1',
        lines: const <CounterCartLine>[
          CounterCartLine(product: product, quantity: 2),
        ],
        payments: const <PaymentEntry>[
          PaymentEntry(method: cash, amountCents: 1500),
          PaymentEntry(method: pix, amountCents: 500),
        ],
        totals: const CounterTotals(
          subtotalCents: 2000,
          discountCents: 0,
          itemCount: 2,
          totalCents: 2000,
        ),
        customer: const Customer(id: 'cust-1', name: 'Ana'),
        consumerDocument: '52998224725',
      );

      expect(body['operatorId'], 'op-1');
      expect(body['customerId'], 'cust-1');
      expect(body['customerName'], 'Ana');
      expect(body['consumerDocument'], '52998224725');
      expect((body['lines'] as List<dynamic>), hasLength(1));
      expect(
        (body['lines'] as List<dynamic>)
            .cast<Map<String, dynamic>>()
            .first['productId'],
        'prod-1',
      );
      final List<Map<String, dynamic>> payments =
          (body['payments'] as List<dynamic>).cast<Map<String, dynamic>>();
      expect(payments.first['methodId'], 'uuid-cash');
      expect(payments.last['cardPaymentType'], 'pix');
    });

    test('variante com skuId composto envia o product.id UUID', () {
      final Map<String, dynamic> body = buildPosSaleBody(
        operatorId: 'op-1',
        lines: const <CounterCartLine>[
          CounterCartLine(
            product: product,
            quantity: 1,
            skuId: 'prod-1:opt-a:opt-b',
            variantLabel: 'P / Azul',
          ),
        ],
        payments: const <PaymentEntry>[
          PaymentEntry(method: cash, amountCents: 1000),
        ],
        totals: const CounterTotals(
          subtotalCents: 1000,
          discountCents: 0,
          itemCount: 1,
          totalCents: 1000,
        ),
      );

      final Map<String, dynamic> line =
          (body['lines'] as List<dynamic>).cast<Map<String, dynamic>>().single;
      expect(line['productId'], 'prod-1');
      expect(line['productId'], isNot(contains(':')));
    });

    test('nome avulso sem id CRM não envia customerId', () {
      final Map<String, dynamic> body = buildPosSaleBody(
        operatorId: 'op-1',
        lines: const <CounterCartLine>[
          CounterCartLine(product: product, quantity: 1),
        ],
        payments: const <PaymentEntry>[
          PaymentEntry(method: cash, amountCents: 1000),
        ],
        totals: const CounterTotals(
          subtotalCents: 1000,
          discountCents: 0,
          itemCount: 1,
          totalCents: 1000,
        ),
        customer: const Customer(id: '', name: 'Avulso'),
      );

      expect(body.containsKey('customerId'), isFalse);
      expect(body['customerName'], 'Avulso');
    });

    test(
      'envia discountAuthorizedByUserId quando o ajuste tem autorizador',
      () {
        final Map<String, dynamic> body = buildPosSaleBody(
          operatorId: 'op-1',
          lines: const <CounterCartLine>[
            CounterCartLine(product: product, quantity: 1),
          ],
          payments: const <PaymentEntry>[
            PaymentEntry(method: cash, amountCents: 900),
          ],
          totals: const CounterTotals(
            subtotalCents: 1000,
            discountCents: 100,
            itemCount: 1,
            totalCents: 900,
            saleAdjustmentCents: -100,
          ),
          saleAdjustment: const SaleAdjustment(
            kind: SaleAdjustmentKind.discount,
            mode: SaleAdjustmentMode.amount,
            amountCents: 100,
            authorizedByOperatorId: 'supervisor-1',
          ),
        );

        expect(body['discountsCents'], 100);
        expect(body['discountAuthorizedByUserId'], 'supervisor-1');
      },
    );

    test('omite discountAuthorizedByUserId sem autorizador', () {
      final Map<String, dynamic> body = buildPosSaleBody(
        operatorId: 'op-1',
        lines: const <CounterCartLine>[
          CounterCartLine(product: product, quantity: 1),
        ],
        payments: const <PaymentEntry>[
          PaymentEntry(method: cash, amountCents: 1000),
        ],
        totals: const CounterTotals(
          subtotalCents: 1000,
          discountCents: 0,
          itemCount: 1,
          totalCents: 1000,
        ),
      );

      expect(body.containsKey('discountAuthorizedByUserId'), isFalse);
    });

    test('delivery agrega frete + encargos food no deliveryFeeCents', () {
      final Map<String, dynamic> body = buildPosSaleBody(
        operatorId: 'op-1',
        lines: const <CounterCartLine>[
          CounterCartLine(product: product, quantity: 1),
        ],
        payments: const <PaymentEntry>[
          PaymentEntry(method: cash, amountCents: 1375),
        ],
        totals: const CounterTotals(
          subtotalCents: 1000,
          discountCents: 0,
          itemCount: 1,
          totalCents: 1375,
          deliveryFeeCents: 200,
          couvertCents: 50,
          serviceFeeCents: 100,
          saleAdjustmentCents: 25,
        ),
        posDeliveryOrderId: 'delivery-1',
      );

      expect(body['posDeliveryOrderId'], 'delivery-1');
      // 200 frete + 50 couvert + 100 serviço + 25 acréscimo
      expect(body['deliveryFeeCents'], 375);
    });
  });

  group('validateInvoiceDocument', () {
    test('vazio ok', () {
      expect(
        validateInvoiceDocument(digits: '', type: CounterDocumentType.cpf),
        isNull,
      );
    });

    test('CPF incompleto falha', () {
      expect(
        validateInvoiceDocument(digits: '123', type: CounterDocumentType.cpf),
        isNotNull,
      );
    });

    test('CPF com 11 dígitos ok', () {
      expect(
        validateInvoiceDocument(
          digits: '52998224725',
          type: CounterDocumentType.cpf,
        ),
        isNull,
      );
    });
  });

  test('cardPaymentTypeForSystemKey', () {
    expect(cardPaymentTypeForSystemKey('pm-pix'), 'pix');
    expect(cardPaymentTypeForSystemKey('pm-cartao'), 'credit');
    expect(cardPaymentTypeForSystemKey('pm-cartao-debito'), 'debit');
    expect(cardPaymentTypeForSystemKey('pm-dinheiro'), isNull);
  });

  group('soldQuantitiesFromCart', () {
    test('soma só produtos trackStock', () {
      const CounterProduct tracked = CounterProduct(
        id: 'a',
        name: 'A',
        priceCents: 100,
        categoryId: 'c',
        trackStock: true,
        stockQty: 10,
      );
      const CounterProduct free = CounterProduct(
        id: 'b',
        name: 'B',
        priceCents: 100,
        categoryId: 'c',
      );
      final Map<String, double> sold =
          soldQuantitiesFromCart(const <CounterCartLine>[
            CounterCartLine(product: tracked, quantity: 2),
            CounterCartLine(product: free, quantity: 5),
            CounterCartLine(product: tracked, quantity: 1),
          ]);
      expect(sold, <String, double>{'a': 3});
    });
  });

  group('CounterProduct.fromJson stock defaults', () {
    test('cache antigo sem campos → trackStock false, stockQty null', () {
      final CounterProduct parsed = CounterProduct.fromJson(<String, dynamic>{
        'id': 'p1',
        'name': 'Item',
        'priceCents': 100,
        'categoryId': 'c',
      });
      expect(parsed.trackStock, isFalse);
      expect(parsed.stockQty, isNull);
    });

    test('parseia stockQty string decimal', () {
      final CounterProduct parsed = CounterProduct.fromJson(<String, dynamic>{
        'id': 'p1',
        'name': 'Item',
        'priceCents': 100,
        'categoryId': 'c',
        'trackStock': true,
        'stockQty': '12.000',
      });
      expect(parsed.trackStock, isTrue);
      expect(parsed.stockQty, 12.0);
    });
  });
}
