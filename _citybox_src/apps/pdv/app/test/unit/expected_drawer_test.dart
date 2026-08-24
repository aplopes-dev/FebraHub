import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  final DateTime t0 = DateTime.utc(2026, 8, 5);

  CashShift base({
    List<CashMovement> movements = const <CashMovement>[],
    List<SaleRecord> sales = const <SaleRecord>[],
    int floatCents = 10000,
  }) {
    return CashShift(
      id: 's1',
      status: CashShiftStatus.open,
      openedAt: t0,
      openingFloatCents: floatCents,
      movements: movements,
      sales: sales,
    );
  }

  test('fundo only', () {
    expect(expectedDrawerCents(base()), 10000);
  });

  test('reinforcement and withdrawal', () {
    final CashShift shift = base(
      movements: <CashMovement>[
        CashMovement(
          id: 'm1',
          type: CashMovementType.reinforcement,
          amountCents: 5000,
          reason: 'troco',
          createdAt: t0,
          shiftId: 's1',
        ),
        CashMovement(
          id: 'm2',
          type: CashMovementType.withdrawal,
          amountCents: 2000,
          reason: 'sangria',
          createdAt: t0,
          shiftId: 's1',
        ),
      ],
    );
    expect(expectedDrawerCents(shift), 13000);
  });

  test('completed cash sale adds cashNet; card ignored; cancelled ignored', () {
    final CashShift shift = base(
      sales: <SaleRecord>[
        SaleRecord(
          id: 'v1',
          shiftId: 's1',
          status: SaleRecordStatus.completed,
          createdAt: t0,
          lines: const <SaleLineSnapshot>[],
          payments: const <SalePaymentSnapshot>[],
          subtotalCents: 5000,
          totalCents: 5000,
          cashReceivedCents: 5000,
          changeCents: 0,
          cashNetCents: 5000,
        ),
        SaleRecord(
          id: 'v2',
          shiftId: 's1',
          status: SaleRecordStatus.completed,
          createdAt: t0,
          lines: const <SaleLineSnapshot>[],
          payments: const <SalePaymentSnapshot>[],
          subtotalCents: 3000,
          totalCents: 3000,
          cashReceivedCents: 0,
          changeCents: 0,
          cashNetCents: 0,
        ),
        SaleRecord(
          id: 'v3',
          shiftId: 's1',
          status: SaleRecordStatus.cancelled,
          createdAt: t0,
          lines: const <SaleLineSnapshot>[],
          payments: const <SalePaymentSnapshot>[],
          subtotalCents: 1000,
          totalCents: 1000,
          cashReceivedCents: 1000,
          changeCents: 0,
          cashNetCents: 1000,
        ),
      ],
    );
    expect(expectedDrawerCents(shift), 15000);
  });
}
