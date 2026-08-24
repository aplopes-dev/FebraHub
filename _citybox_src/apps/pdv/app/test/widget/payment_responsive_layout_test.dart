import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/features/payment/presentation/payment_page.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/payment_summary_panel.dart';

import '../helpers/pump_with_router.dart';

void main() {
  testWidgets('PaymentPage em largura 800 permanece utilizável', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.payment,
      size: const Size(800, 1200),
      withOpenShift: true,
    );

    expect(find.byType(PaymentPage), findsOneWidget);
    expect(find.byType(PaymentSummaryPanel), findsOneWidget);
  });
}
