import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/format/normalize_for_search.dart';
import 'package:citybox_pdv/features/payment/data/seller_catalog.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';

const Seller _jessica = Seller(
  id: 'seller_03',
  code: '03',
  name: 'Jéssica Andrade',
);

void main() {
  group('Seller.matches', () {
    test('busca vazia casa com todo mundo', () {
      expect(_jessica.matches(''), isTrue);
      expect(_jessica.matches('   '), isTrue);
    });

    test('acha por parte do nome, ignorando caixa', () {
      expect(_jessica.matches('andrade'), isTrue);
      expect(_jessica.matches('ANDRADE'), isTrue);
    });

    test('acha nome acentuado digitado sem acento', () {
      // Quem está com pressa não digita "Jéssica".
      expect(_jessica.matches('jessica'), isTrue);
    });

    test('acha pelo código do vendedor', () {
      expect(_jessica.matches('03'), isTrue);
    });

    test('não casa com quem não é', () {
      expect(_jessica.matches('rafael'), isFalse);
      expect(_jessica.matches('09'), isFalse);
    });
  });

  group('normalizeForSearch', () {
    test('tira acento, cedilha e caixa', () {
      expect(normalizeForSearch('Conceição'), 'conceicao');
      expect(normalizeForSearch('Antônio'), 'antonio');
      expect(normalizeForSearch('  Vinícius  '), 'vinicius');
    });
  });

  group('sortedByName', () {
    test('ordena ignorando acento e caixa', () {
      final List<Seller> ordered = sortedByName(
        const <Seller>[
          Seller(id: '3', code: '3', name: 'Érica'),
          Seller(id: '1', code: '1', name: 'ana'),
          Seller(id: '2', code: '2', name: 'Bruno'),
        ],
        (Seller s) => s.name,
      );
      expect(
        ordered.map((Seller s) => s.name).toList(),
        <String>['ana', 'Bruno', 'Érica'],
      );
    });
  });

  group('catálogo de vendedores (fixture de teste)', () {
    test('não repete código nem id', () {
      final Set<String> codes = testSellers.map((Seller s) => s.code).toSet();
      final Set<String> ids = testSellers.map((Seller s) => s.id).toSet();

      expect(codes, hasLength(testSellers.length));
      expect(ids, hasLength(testSellers.length));
    });
  });
}
