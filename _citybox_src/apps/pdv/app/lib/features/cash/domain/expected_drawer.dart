import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';

/// Esperado em gaveta (Q3 / FR-023).
int expectedDrawerCents(CashShift shift) {
  int total = shift.openingFloatCents;
  for (final CashMovement m in shift.movements) {
    if (m.type == CashMovementType.reinforcement) {
      total += m.amountCents;
    } else {
      total -= m.amountCents;
    }
  }
  for (final SaleRecord sale in shift.sales) {
    if (sale.status == SaleRecordStatus.completed) {
      total += sale.cashNetCents;
    }
  }
  return total;
}
