import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/display_sale_number.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/sales_history/application/cancel_sale_error_message.dart';

void main() {
  group('sessionSaleToSaleRecord', () {
    test('mapeia closed → completed e preenche server ids', () {
      final SaleRecord sale = sessionSaleToSaleRecord(<String, dynamic>{
        'id': 'sale-1',
        'sessionId': 'sess-1',
        'number': 42,
        'customerName': 'Ana',
        'sellerName': '',
        'operatorName': 'Maria',
        'status': 'closed',
        'amountCents': 1500,
        'startedAt': '2026-08-15T10:00:00.000Z',
        'products': <Map<String, dynamic>>[
          <String, dynamic>{
            'id': 'line-1',
            'productName': 'Água',
            'quantity': 2,
            'unitPriceCents': 750,
            'totalCents': 1500,
          },
        ],
        'payments': <Map<String, dynamic>>[
          <String, dynamic>{
            'id': 'pay-1',
            'methodId': 'pm-uuid-pix',
            'method': 'PIX',
            'methodSystemKey': 'pm-pix',
            'amountCents': 1500,
          },
        ],
      });

      expect(sale.id, 'sale-1');
      expect(sale.serverSaleId, 'sale-1');
      expect(sale.serverNumber, 42);
      expect(sale.number, 42);
      expect(sale.status, SaleRecordStatus.completed);
      expect(sale.lines, hasLength(1));
      expect(sale.lines.first.name, 'Água');
      expect(sale.payments.first.methodLabel, 'PIX');
      expect(sale.payments.first.methodId, 'pm-uuid-pix');
      expect(sale.payments.first.systemKey, 'pm-pix');
      expect(sale.sellerName, isNull);
      expect(sale.operatorName, 'Maria');
      expect(sale.cashNetCents, 0);
    });

    test('dinheiro líquido entra na gaveta (troco descontado)', () {
      final SaleRecord sale = sessionSaleToSaleRecord(<String, dynamic>{
        'id': 'sale-cash',
        'sessionId': 'sess-1',
        'number': 3,
        'operatorName': 'Leticia',
        'sellerName': 'Leticia',
        'status': 'closed',
        'amountCents': 2100,
        'startedAt': '2026-08-15T10:00:00.000Z',
        'products': <dynamic>[],
        'payments': <Map<String, dynamic>>[
          <String, dynamic>{
            'id': 'pay-1',
            'methodId': 'pm-uuid-cash',
            'method': 'Dinheiro',
            'methodSystemKey': 'pm-dinheiro',
            'amountCents': 5000,
          },
        ],
      });

      expect(sale.cashReceivedCents, 5000);
      expect(sale.changeCents, 2900);
      expect(sale.cashNetCents, 2100);
      expect(sale.operatorName, 'Leticia');
    });

    test('refresh do servidor alimenta esperado em gaveta', () {
      final SaleRecord saleA = sessionSaleToSaleRecord(<String, dynamic>{
        'id': 'a',
        'sessionId': 'sess',
        'number': 1,
        'status': 'closed',
        'amountCents': 65700,
        'startedAt': '2026-08-15T10:00:00.000Z',
        'products': <dynamic>[],
        'payments': <Map<String, dynamic>>[
          <String, dynamic>{
            'id': 'p1',
            'method': 'Dinheiro',
            'methodSystemKey': 'pm-dinheiro',
            'amountCents': 65700,
          },
        ],
      });
      final SaleRecord saleB = sessionSaleToSaleRecord(<String, dynamic>{
        'id': 'b',
        'sessionId': 'sess',
        'number': 2,
        'status': 'closed',
        'amountCents': 2100,
        'startedAt': '2026-08-15T10:01:00.000Z',
        'products': <dynamic>[],
        'payments': <Map<String, dynamic>>[
          <String, dynamic>{
            'id': 'p2',
            'method': 'Dinheiro',
            'methodSystemKey': 'pm-dinheiro',
            'amountCents': 2100,
          },
        ],
      });
      final SaleRecord saleC = sessionSaleToSaleRecord(<String, dynamic>{
        'id': 'c',
        'sessionId': 'sess',
        'number': 3,
        'status': 'closed',
        'amountCents': 6800,
        'startedAt': '2026-08-15T10:02:00.000Z',
        'products': <dynamic>[],
        'payments': <Map<String, dynamic>>[
          <String, dynamic>{
            'id': 'p3',
            'method': 'Dinheiro',
            'methodSystemKey': 'pm-dinheiro',
            'amountCents': 6800,
          },
        ],
      });

      final CashShift shift = CashShift(
        id: 'sess',
        status: CashShiftStatus.open,
        openedAt: DateTime.utc(2026, 8, 15, 13),
        openingFloatCents: 30000,
        openedByOperatorId: 'op',
        openedByOperatorName: 'Leticia',
        movements: <CashMovement>[
          CashMovement(
            id: 'm1',
            type: CashMovementType.withdrawal,
            amountCents: 10000,
            reason: 'sangria',
            operation: CashOperationType.other,
            createdAt: DateTime.utc(2026, 8, 15, 14),
            shiftId: 'sess',
          ),
        ],
        sales: <SaleRecord>[saleA, saleB, saleC],
      );

      // 300 + 657 + 21 + 68 − 100 = 946
      expect(expectedDrawerCents(shift), 94600);
    });

    test('cancelled → cancelled', () {
      final SaleRecord sale = sessionSaleToSaleRecord(<String, dynamic>{
        'id': 'sale-2',
        'sessionId': 'sess-1',
        'number': 1,
        'status': 'cancelled',
        'amountCents': 100,
        'startedAt': '2026-08-15T10:00:00.000Z',
        'products': <dynamic>[],
        'payments': <dynamic>[],
      });
      expect(sale.status, SaleRecordStatus.cancelled);
    });
  });

  group('displaySaleNumber', () {
    final DateTime at = DateTime.utc(2026, 8, 15);

    SaleRecord base({int number = 0, int? serverNumber}) {
      return SaleRecord(
        id: '1',
        number: number,
        serverNumber: serverNumber,
        shiftId: 's',
        status: SaleRecordStatus.completed,
        createdAt: at,
        lines: const <SaleLineSnapshot>[],
        payments: const <SalePaymentSnapshot>[],
        subtotalCents: 0,
        totalCents: 0,
        cashReceivedCents: 0,
        changeCents: 0,
        cashNetCents: 0,
      );
    }

    test('prefere serverNumber', () {
      expect(displaySaleNumber(base(number: 3, serverNumber: 99)), '#99');
    });

    test('cai no number local', () {
      expect(displaySaleNumber(base(number: 7)), '#7');
    });

    test('sem número → traço', () {
      expect(displaySaleNumber(base()), '—');
    });
  });

  group('cancelSaleErrorMessage', () {
    test('recebíveis conciliados', () {
      final String msg = cancelSaleErrorMessage(
        PdvApiException(
          'Esta venda tem recebíveis conciliados no extrato e não pode ser cancelada.',
          code: 'PosSaleReceivablesInUseError',
        ),
      );
      expect(msg, contains('recebíveis conciliados'));
    });

    test('fallback genérico', () {
      final String msg = cancelSaleErrorMessage(
        PdvApiException('erro', code: 'Unknown'),
      );
      expect(msg, contains('Não foi possível cancelar'));
    });
  });
}
