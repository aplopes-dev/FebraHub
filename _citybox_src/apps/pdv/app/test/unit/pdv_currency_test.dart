import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';

void main() {
  _moneyInput();
  test('formatCents formata pt_BR', () {
    expect(formatCents(0), contains('0,00'));
    expect(formatCents(250), contains('2,50'));
    expect(formatCents(550), contains('5,50'));
    expect(formatCents(1000), contains('10,00'));
  });
}

void _moneyInput() {
  group('centsFromDigits', () {
    test('lê da direita para a esquerda, como caixa registradora', () {
      // Não existe vírgula para acertar: o que se digita é centavo.
      expect(centsFromDigits('1'), 1);
      expect(centsFromDigits('12'), 12);
      expect(centsFromDigits('1250'), 1250);
      expect(centsFromDigits('123456'), 123456);
    });

    test('ignora o que não for dígito', () {
      expect(centsFromDigits(r'R$ 12,50'), 1250);
      expect(centsFromDigits('1.234,56'), 123456);
    });

    test('campo vazio é zero', () {
      expect(centsFromDigits(''), 0);
      expect(centsFromDigits('abc'), 0);
      expect(centsFromDigits(r'R$ ,'), 0);
    });

    test('corta o excesso à esquerda em vez de estourar o int', () {
      // 20 dígitos não cabem num int64; sem o teto, um dedo preso na tecla
      // derrubaria a tela.
      expect(() => centsFromDigits('9' * 20), returnsNormally);
    });
  });

  group('maskCurrencyInput', () {
    test('formata o que foi digitado', () {
      expect(maskCurrencyInput('1'), formatCents(1));
      expect(maskCurrencyInput('1250'), formatCents(1250));
    });

    test('campo intocado continua vazio', () {
      // Mostrar "R$ 0,00" num campo em branco esconde que nada foi digitado.
      expect(maskCurrencyInput(''), '');
      expect(maskCurrencyInput('abc'), '');
    });
  });
}
