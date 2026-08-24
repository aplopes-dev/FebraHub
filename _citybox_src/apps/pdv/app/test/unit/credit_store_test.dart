import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/credit/data/shared_preferences_credit_store.dart';
import 'package:citybox_pdv/features/credit/domain/credit_models.dart';

void main() {
  test('vazio no primeiro boot + round-trip pdv.credit.v1', () async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final SharedPreferencesCreditStore store = SharedPreferencesCreditStore(
      prefs,
    );

    final CreditState initial = await store.read();
    expect(initial.accounts, isEmpty);
    expect(initial.entries, isEmpty);

    final DateTime now = DateTime.utc(2026, 8, 5);
    final CreditState next = CreditState(
      accounts: <CustomerCreditAccount>[
        CustomerCreditAccount(
          customerId: 'cust_01',
          balanceCents: 9000,
          updatedAt: now,
        ),
      ],
      entries: <CreditLedgerEntry>[
        CreditLedgerEntry(
          id: 'e1',
          customerId: 'cust_01',
          type: CreditEntryType.charge,
          amountCents: 9000,
          createdAt: now,
          note: 'manual',
        ),
      ],
    );
    await store.write(next);

    final CreditState loaded = await store.read();
    expect(loaded.accountFor('cust_01')!.balanceCents, 9000);
    expect(loaded.entries, hasLength(1));
  });
}
