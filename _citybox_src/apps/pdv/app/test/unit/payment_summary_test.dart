import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/payment/domain/payment_summary.dart';

void main() {
  group('PaymentSummary', () {
    test('remaining e change com recebido parcial', () {
      const PaymentSummary summary = PaymentSummary(
        totalCents: 10000,
        receivedCents: 0,
      );
      expect(summary.remainingCents, 10000);
      expect(summary.changeCents, 0);
      expect(summary.canFinalize, isFalse);
    });

    test('fecha quando recebido iguala total (sem float)', () {
      const PaymentSummary summary = PaymentSummary(
        totalCents: 2999,
        receivedCents: 2999,
      );
      expect(summary.remainingCents, 0);
      expect(summary.changeCents, 0);
      expect(summary.canFinalize, isTrue);
    });

    test('troco quando recebe a mais', () {
      const PaymentSummary summary = PaymentSummary(
        totalCents: 10000,
        receivedCents: 15000,
      );
      expect(summary.remainingCents, 0);
      expect(summary.changeCents, 5000);
      expect(summary.canFinalize, isTrue);
    });

    test('total zero não finaliza', () {
      const PaymentSummary summary = PaymentSummary(
        totalCents: 0,
        receivedCents: 0,
      );
      expect(summary.canFinalize, isFalse);
    });
  });
}
