import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:citybox_pdv/core/storage/secure_store_failure.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';

/// Onde a alçada sincronizada fica entre um boot e outro.
///
/// **No cofre, e não em `SharedPreferences`** — apesar de a alçada não ser
/// segredo nenhum. O motivo é integridade, não sigilo: `SharedPreferences` é
/// um XML em texto claro que qualquer um edita num aparelho com root, e o que
/// está guardado aqui é exatamente *até onde o operador vai sem pedir
/// autorização*. Guardar em texto editável entregaria o limite para quem ele
/// existe para conter.
///
/// Segundo motivo, menor: fica no mesmo ciclo de vida da credencial do
/// terminal, então desativar o dispositivo apaga os dois juntos.
abstract interface class PosPolicyStore {
  Future<PosPolicy?> read();
  Future<void> write(PosPolicy policy);
  Future<void> clear();
}

class SecurePosPolicyStore implements PosPolicyStore {
  const SecurePosPolicyStore(this._storage);

  final FlutterSecureStorage _storage;

  /// Chave versionada, como a da credencial: formato novo troca a chave e o
  /// terminal cai no valor restritivo até sincronizar, em vez de tentar ler
  /// algo que não entende mais.
  static const String key = 'pdv.pos_policy.v1';

  @override
  Future<PosPolicy?> read() {
    return readFromVault<PosPolicy>(() async {
      final String? raw = await _storage.read(key: key);
      if (raw == null || raw.isEmpty) return null;
      try {
        final Object? decoded = jsonDecode(raw);
        if (decoded is! Map<String, dynamic>) return null;
        return PosPolicy.fromJson(decoded);
      } on FormatException {
        // Cache corrompido é tratado como ausente — e ausente significa
        // `PosPolicy.restrictive`, nunca "sem limite".
        return null;
      }
    });
  }

  /// Silencioso ao falhar, ao contrário da credencial: a alçada é rebuscada a
  /// cada boot, então não persistir custa uma ida à rede, não uma operação
  /// impossível. E o valor em memória — o que a tela usa — já foi publicado.
  @override
  Future<void> write(PosPolicy policy) async {
    await readFromVault<void>(
      () => _storage.write(key: key, value: jsonEncode(policy.toJson())),
    );
  }

  @override
  Future<void> clear() async {
    await readFromVault<void>(() => _storage.delete(key: key));
  }
}
