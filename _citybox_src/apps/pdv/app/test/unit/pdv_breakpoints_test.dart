import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/layout/pdv_breakpoints.dart';

void main() {
  test('PdvLayout.ofWidth faixas oficiais', () {
    expect(PdvLayout.ofWidth(719), PdvFormat.compact);
    expect(PdvLayout.ofWidth(720), PdvFormat.medium);
    expect(PdvLayout.ofWidth(1199), PdvFormat.medium);
    expect(PdvLayout.ofWidth(1200), PdvFormat.expanded);
  });
}
