import 'package:citybox_pdv/features/payment/domain/seller.dart';

/// Fixture **só para testes** — produção usa `GET /v1/pos/sellers`.
const List<Seller> testSellers = <Seller>[
  Seller(id: 'seller_01', code: '01', name: 'Ana Beatriz Marques'),
  Seller(id: 'seller_02', code: '02', name: 'Carlos Eduardo Nunes'),
  Seller(id: 'seller_03', code: '03', name: 'Jéssica Andrade'),
  Seller(id: 'seller_04', code: '04', name: 'João Pedro Vasconcelos'),
  Seller(id: 'seller_05', code: '05', name: 'Larissa Conceição'),
  Seller(id: 'seller_06', code: '06', name: 'Marcos Antônio Silva'),
  Seller(id: 'seller_07', code: '07', name: 'Rafael Souza Lima'),
  Seller(id: 'seller_08', code: '08', name: 'Sabrina Costa'),
];
