import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/crypto/pdv_pin_hasher.dart';

/// Hash **gerado pela `erp-api`**, rodando `PinHasher.hash('1234')`.
///
/// Escrito à mão não provaria nada: o ponto do teste é que as duas
/// implementações de scrypt — Node e pointycastle — chegam ao mesmo valor. Se
/// o algoritmo ou os parâmetros divergirem, é aqui que aparece.
const String apiHashOf1234 =
    r'scrypt$65536$8$1$Z8eoOqS1F75CXJDKk0iKYw==$'
    r'J7DjLUcgqNwW9l5ExRDNvKCunAo2i1guuhdXu6KUkZg=';

void main() {
  group('PdvPinHasher.verify — compatibilidade com a API', () {
    test('confere o PIN certo contra hash gerado pela API', () {
      expect(PdvPinHasher.verify('1234', apiHashOf1234), isTrue);
    });

    test('recusa PIN errado', () {
      expect(PdvPinHasher.verify('9999', apiHashOf1234), isFalse);
      expect(PdvPinHasher.verify('', apiHashOf1234), isFalse);
      expect(PdvPinHasher.verify('12345', apiHashOf1234), isFalse);
    });
  });

  group('PdvPinHasher.verify — valor gravado inválido', () {
    test('formato desconhecido devolve false, não lança', () {
      for (final String bad in <String>[
        '',
        'lixo',
        r'argon2id$65536$8$1$c2FsdA==$aGFzaA==',
        r'scrypt$65536$8$1$c2FsdA==',
        r'scrypt$abc$8$1$c2FsdA==$aGFzaA==',
        r'scrypt$65536$8$1$não-é-base64!$aGFzaA==',
        r'scrypt$65536$8$1$$aGFzaA==',
      ]) {
        expect(
          PdvPinHasher.verify('1234', bad),
          isFalse,
          reason: 'entrada: "$bad"',
        );
      }
    });

    test('custo absurdo é recusado sem derivar', () {
      // Um servidor comprometido mandando N gigante travaria o caixa por
      // minutos. O teste é rápido justamente porque a derivação não acontece.
      final Stopwatch clock = Stopwatch()..start();
      final bool result = PdvPinHasher.verify(
        '1234',
        r'scrypt$2147483647$8$1$c2FsdHNhbHRzYWx0c2E=$aGFzaGhhc2hoYXNoaGFzaA==',
      );
      clock.stop();

      expect(result, isFalse);
      expect(clock.elapsed, lessThan(const Duration(seconds: 1)));
    });
  });

  group('Custo em tempo', () {
    test('uma verificação fica dentro do orçamento de um login', () {
      final Stopwatch clock = Stopwatch()..start();
      PdvPinHasher.verify('1234', apiHashOf1234);
      clock.stop();

      // Não é benchmark — é uma trava contra regressão grosseira. O risco real
      // registrado no plano é N=65536 num tablet Android fraco; a máquina de
      // CI é otimista, então o limite é folgado de propósito. Se doer no
      // aparelho, o parâmetro vem no próprio hash e desce sem migration.
      expect(clock.elapsed, lessThan(const Duration(seconds: 5)));
    });
  });
}
