import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/cash/domain/cash_close_channel.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';

SalePaymentSnapshot _payment(String methodId, int cents) {
  return SalePaymentSnapshot(
    methodId: methodId,
    methodLabel: methodId,
    amountCents: cents,
  );
}

SaleRecord _sale({
  required List<SalePaymentSnapshot> payments,
  SaleRecordStatus status = SaleRecordStatus.completed,
  int cashNetCents = 0,
}) {
  return SaleRecord(
    id: 'sale-${payments.hashCode}',
    shiftId: 'shift',
    status: status,
    createdAt: DateTime(2026, 8, 5, 10),
    lines: const <SaleLineSnapshot>[],
    payments: payments,
    subtotalCents: 0,
    totalCents: 0,
    cashReceivedCents: 0,
    changeCents: 0,
    cashNetCents: cashNetCents,
  );
}

CashShift _shift({
  int openingFloatCents = 10000,
  List<SaleRecord> sales = const <SaleRecord>[],
  List<CashMovement> movements = const <CashMovement>[],
}) {
  return CashShift(
    id: 'shift',
    status: CashShiftStatus.open,
    openedAt: DateTime(2026, 8, 5, 8),
    openingFloatCents: openingFloatCents,
    movements: movements,
    sales: sales,
  );
}

void main() {
  group('expectedByChannel', () {
    test('dinheiro é a gaveta, não a soma dos pagamentos em dinheiro', () {
      // A gaveta guarda o fundo de abertura além do que a venda trouxe: somar
      // só os pagamentos deixaria o operador com sobra de R$ 100 todo dia.
      final CashShift shift = _shift(
        sales: <SaleRecord>[
          _sale(
            payments: <SalePaymentSnapshot>[_payment('cash', 5000)],
            cashNetCents: 5000,
          ),
        ],
      );

      expect(expectedByChannel(shift)[CashCloseChannel.cash], 15000);
    });

    test('sangria e reforço mexem no dinheiro esperado', () {
      final CashShift shift = _shift(
        movements: <CashMovement>[
          CashMovement(
            id: 'm1',
            type: CashMovementType.withdrawal,
            amountCents: 3000,
            reason: 'sangria',
            createdAt: DateTime(2026, 8, 5, 9),
            shiftId: 'shift',
          ),
        ],
      );

      expect(expectedByChannel(shift)[CashCloseChannel.cash], 7000);
    });

    test('crédito, débito e voucher somam por forma de pagamento', () {
      final CashShift shift = _shift(
        sales: <SaleRecord>[
          _sale(
            payments: <SalePaymentSnapshot>[
              _payment('credit_card', 2500),
              _payment('debit_card', 1000),
            ],
          ),
          _sale(
            payments: <SalePaymentSnapshot>[
              _payment('credit_card', 500),
              _payment('employee_voucher', 800),
            ],
          ),
        ],
      );

      final Map<CashCloseChannel, int> totals = expectedByChannel(shift);
      expect(totals[CashCloseChannel.credit], 3000);
      expect(totals[CashCloseChannel.debit], 1000);
      expect(totals[CashCloseChannel.voucher], 800);
    });

    test('forma sem canal próprio cai em Outros, e não some', () {
      final CashShift shift = _shift(
        sales: <SaleRecord>[
          _sale(
            payments: <SalePaymentSnapshot>[
              _payment('pix', 1200),
              _payment('ifood', 300),
              _payment('forma_nova_da_loja', 100),
            ],
          ),
        ],
      );

      expect(expectedByChannel(shift)[CashCloseChannel.other], 1600);
    });

    test('venda cancelada não entra em canal nenhum', () {
      final CashShift shift = _shift(
        sales: <SaleRecord>[
          _sale(
            payments: <SalePaymentSnapshot>[_payment('credit_card', 9900)],
            status: SaleRecordStatus.cancelled,
          ),
        ],
      );

      expect(expectedByChannel(shift)[CashCloseChannel.credit], 0);
    });

    test('turno sem venda devolve todos os canais, zerados', () {
      final Map<CashCloseChannel, int> totals = expectedByChannel(
        _shift(openingFloatCents: 0),
      );

      expect(totals.keys, containsAll(CashCloseChannel.values));
      expect(totals.values.every((int v) => v == 0), isTrue);
    });
  });

  test('channelOfPaymentMethod mapeia as formas do catálogo', () {
    expect(channelOfPaymentMethod('cash'), CashCloseChannel.cash);
    expect(channelOfPaymentMethod('pm-dinheiro'), CashCloseChannel.cash);
    expect(channelOfPaymentMethod('credit_card'), CashCloseChannel.credit);
    expect(channelOfPaymentMethod('pm-cartao'), CashCloseChannel.credit);
    expect(channelOfPaymentMethod('debit_card'), CashCloseChannel.debit);
    expect(channelOfPaymentMethod('pm-cartao-debito'), CashCloseChannel.debit);
    expect(
      channelOfPaymentMethod('employee_voucher'),
      CashCloseChannel.voucher,
    );
    expect(channelOfPaymentMethod('courtesy'), CashCloseChannel.other);
  });
}
