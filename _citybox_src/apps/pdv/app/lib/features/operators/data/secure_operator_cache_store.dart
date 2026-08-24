import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:citybox_pdv/core/storage/secure_store_failure.dart';
import 'package:citybox_pdv/features/operators/domain/operator_cache.dart';

/// Onde os hashes de PIN da equipe ficam guardados.
///
/// **Cofre do sistema, e aqui não há discussão possível**: são hashes de
/// credencial de todos os operadores ativos da unidade. `SharedPreferences` é
/// XML em texto claro que sai num backup do aparelho — seria entregar a lista
/// inteira junto.
///
/// (Ver `SecurePosPolicyStore`, que usa o mesmo cofre por integridade e não por
/// sigilo. Este é o caso em que é sigilo mesmo.)
abstract interface class OperatorCacheStore {
  Future<OperatorCache?> read();
  Future<void> write(OperatorCache cache);
  Future<void> clear();

  /// Tentativas erradas por código, **persistidas**.
  ///
  /// Mora aqui, e no cofre, pelo mesmo motivo do cache: um contador que só
  /// existe em memória é zerado fechando e reabrindo o app — e o bloqueio por
  /// tentativas, que é a única defesa real de um PIN de 4 dígitos, viraria
  /// enfeite para quem tem o aparelho na mão.
  Future<Map<String, int>> readAttempts();
  Future<void> writeAttempts(Map<String, int> attempts);
}

class SecureOperatorCacheStore implements OperatorCacheStore {
  const SecureOperatorCacheStore(this._storage);

  final FlutterSecureStorage _storage;

  static const String key = 'pdv.operator_cache.v1';
  static const String attemptsKey = 'pdv.operator_attempts.v1';

  @override
  Future<OperatorCache?> read() {
    return readFromVault<OperatorCache>(() async {
      final String? raw = await _storage.read(key: key);
      if (raw == null || raw.isEmpty) return null;
      try {
        final Object? decoded = jsonDecode(raw);
        if (decoded is! Map<String, dynamic>) return null;
        // `fromJson` já devolve `null` para pacote incompleto — cache
        // corrompido vira "não há cache", que é o mesmo que exigir rede.
        return OperatorCache.fromJson(decoded);
      } on FormatException {
        return null;
      }
    });
  }

  /// Silencioso ao falhar, e a consequência **fica visível**: sem cache
  /// gravado não há login offline, e a barra de título passa a mostrar
  /// "entrada sem rede indisponível". Melhor esse aviso permanente que um erro
  /// modal a cada sincronização de fundo.
  @override
  Future<void> write(OperatorCache cache) async {
    await readFromVault<void>(
      () => _storage.write(key: key, value: jsonEncode(cache.toJson())),
    );
  }

  /// Não apaga [attemptsKey]: desativar o terminal não pode ser a saída para
  /// zerar um bloqueio. Reparear e recomeçar do zero seria o caminho óbvio
  /// para quem está tentando adivinhar um PIN.
  @override
  Future<void> clear() async {
    await readFromVault<void>(() => _storage.delete(key: key));
  }

  @override
  Future<Map<String, int>> readAttempts() async {
    final Map<String, int>? stored = await readFromVault<Map<String, int>>(
      () async {
        final String? raw = await _storage.read(key: attemptsKey);
        if (raw == null || raw.isEmpty) return <String, int>{};
        try {
          final Object? decoded = jsonDecode(raw);
          if (decoded is! Map<String, dynamic>) return <String, int>{};
          return <String, int>{
            for (final MapEntry<String, dynamic> e in decoded.entries)
              if (e.value is int) e.key: e.value as int,
          };
        } on FormatException {
          // Contador corrompido conta como zero. É o lado permissivo do
          // trade-off, e o aceitável: o contador do **servidor** continua
          // valendo online.
          return <String, int>{};
        }
      },
    );
    return stored ?? <String, int>{};
  }

  /// Silencioso: é chamado com `unawaited` a cada tentativa, e um erro aqui
  /// viraria exceção assíncrona não tratada no meio do login. Sem cofre não há
  /// login offline de qualquer forma — e online quem conta é o servidor.
  @override
  Future<void> writeAttempts(Map<String, int> attempts) async {
    await readFromVault<void>(
      () => _storage.write(key: attemptsKey, value: jsonEncode(attempts)),
    );
  }
}
