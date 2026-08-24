import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/format/brazilian_masks.dart';

void main() {
  group('formatCpf / formatCnpj', () {
    test('formata CPF completo', () {
      expect(formatCpf('52998224725'), '529.982.247-25');
    });

    test('formata CNPJ completo', () {
      expect(formatCnpj('12345678000195'), '12.345.678/0001-95');
    });

    test('formata parcial enquanto digita', () {
      expect(formatCpf('52998'), '529.98');
      expect(formatCnpj('12345678'), '12.345.678');
    });
  });

  group('formatPhone', () {
    test('formata fixo com 10 dígitos', () {
      expect(formatPhone('7332310000'), '(73) 3231-0000');
    });

    test('formata celular com 11 dígitos', () {
      expect(formatPhone('73999887766'), '(73) 99988-7766');
    });
  });

  group('formatCep', () {
    test('formata CEP completo', () {
      expect(formatCep('45650970'), '45650-970');
    });
  });

  group('birthDate', () {
    test('formata máscara dd/MM/yyyy', () {
      expect(formatBirthDate('14031988'), '14/03/1988');
    });

    test('converte display → ISO', () {
      expect(birthDateDigitsToIso('14/03/1988'), '1988-03-14');
      expect(birthDateDigitsToIso('14031988'), '1988-03-14');
    });

    test('rejeita data inválida', () {
      expect(birthDateDigitsToIso('32/01/2000'), isNull);
      expect(birthDateDigitsToIso('14/03/88'), isNull);
    });

    test('ISO → display', () {
      expect(birthDateIsoToDisplay('1988-03-14'), '14/03/1988');
      expect(birthDateIsoToDisplay(null), '');
    });
  });

  group('digitsOnly', () {
    test('remove máscara', () {
      expect(digitsOnly('529.982.247-25'), '52998224725');
      expect(digitsOnly('(73) 99988-7766'), '73999887766');
      expect(digitsOnly('45650-970'), '45650970');
    });
  });
}
