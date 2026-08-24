import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/payment/application/terminal_sellers_controller.dart';
import 'package:citybox_pdv/features/payment/data/seller_catalog.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';

/// Vendedor espelhando o operador padrão dos testes — default E.
const Seller testOperatorAsSeller = Seller(
  id: 'op-teste',
  code: '01',
  name: 'Operador de Teste',
);

/// Lista de vendedores já resolvida (sem HTTP).
List<Override> fixtureSellersOverrides({List<Seller>? sellers}) {
  final List<Seller> list =
      sellers ??
      <Seller>[
        testOperatorAsSeller,
        ...testSellers,
      ];
  return <Override>[
    terminalSellersProvider.overrideWith((Ref ref) async => list),
  ];
}
