import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:pointycastle/export.dart';

/// Confere o PIN contra o hash gerado pela `erp-api`.
///
/// **Espelho do `PinHasher` de `apps/erp/api/src/shared/infra/crypto/`.** Este
/// lado só *verifica*: o PDV nunca gera hash, porque nunca cadastra PIN — quem
/// cadastra é o ERP.
///
/// O formato é `scrypt$N$r$p$salt$hash`, com salt e hash em base64. Ele carrega
/// os próprios parâmetros de propósito: mudar o custo do lado do servidor não
/// quebra os terminais, e um hash antigo continua conferindo com os parâmetros
/// com que foi criado.
///
/// ⚠️ **Não invente parâmetros aqui.** Ler `N`, `r` e `p` do valor gravado, e
/// não de constantes locais, é o que mantém os dois lados falando a mesma
/// língua sem coordenação de versão.
class PdvPinHasher {
  const PdvPinHasher._();

  static const String _algorithm = 'scrypt';

  /// Teto de custo aceito, para um valor absurdo vindo de um servidor
  /// comprometido não travar o caixa derivando por minutos. `2^20` já é 16×
  /// o que a API usa hoje.
  static const int _maxN = 1048576;

  /// Confere **fora da thread de UI**.
  ///
  /// Medido com N=65536 (o valor da API hoje): **~750 ms num desktop de
  /// desenvolvimento**. Num tablet Android fraco é plausível passar de 2 s — e
  /// 2 s de thread de UI travada é a tela inteira congelada, animação parada e
  /// toque ignorado, que o operador lê como "o caixa travou".
  ///
  /// Use este método em qualquer caminho que venha de toque. O [verify]
  /// síncrono existe para teste e para chamada já dentro de um isolate.
  static Future<bool> verifyOffThread(String pin, String stored) {
    return compute(_verifyPayload, <String>[pin, stored]);
  }

  /// `false` — nunca exceção — para hash corrompido ou em formato
  /// desconhecido. Um valor ilegível é um PIN que não confere, não um app que
  /// morre na tela de login.
  static bool verify(String pin, String stored) {
    final List<String> parts = stored.split(r'$');
    if (parts.length != 6 || parts[0] != _algorithm) return false;

    final int? n = int.tryParse(parts[1]);
    final int? r = int.tryParse(parts[2]);
    final int? p = int.tryParse(parts[3]);
    if (n == null || r == null || p == null) return false;
    if (n <= 1 || r <= 0 || p <= 0 || n > _maxN) return false;

    final Uint8List? salt = _decodeBase64(parts[4]);
    final Uint8List? expected = _decodeBase64(parts[5]);
    if (salt == null || expected == null) return false;
    if (salt.isEmpty || expected.isEmpty) return false;

    final Uint8List derived;
    try {
      derived = _derive(
        pin: pin,
        salt: salt,
        n: n,
        r: r,
        p: p,
        keyLength: expected.length,
      );
    } on ArgumentError {
      // Combinação de parâmetros que o pointycastle recusa (N não é potência
      // de 2, por exemplo). Mesmo tratamento: não confere.
      return false;
    } on StateError {
      return false;
    }

    return _constantTimeEquals(derived, expected);
  }

  static Uint8List _derive({
    required String pin,
    required Uint8List salt,
    required int n,
    required int r,
    required int p,
    required int keyLength,
  }) {
    final Scrypt scrypt =
        Scrypt()..init(ScryptParameters(n, r, p, keyLength, salt));
    return scrypt.process(Uint8List.fromList(utf8.encode(pin)));
  }

  static Uint8List? _decodeBase64(String value) {
    try {
      return base64Decode(value);
    } on FormatException {
      return null;
    }
  }

  /// Comparação em tempo constante.
  ///
  /// Aqui o vazamento por tempo é menos crítico que no servidor — o atacante
  /// que mede isto já tem o aparelho na mão e o hash junto. Mas o custo é uma
  /// linha, e a versão com `==` seria copiada para onde importa.
  static bool _constantTimeEquals(Uint8List a, Uint8List b) {
    if (a.length != b.length) return false;
    int diff = 0;
    for (int i = 0; i < a.length; i++) {
      diff |= a[i] ^ b[i];
    }
    return diff == 0;
  }
}

/// Entrada do isolate. Função de topo porque `compute` não aceita closure nem
/// método de instância — o argumento tem que ser enviável entre isolates.
bool _verifyPayload(List<String> args) => PdvPinHasher.verify(args[0], args[1]);
