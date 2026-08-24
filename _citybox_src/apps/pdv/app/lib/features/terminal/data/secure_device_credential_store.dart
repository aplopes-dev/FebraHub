import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:citybox_pdv/core/storage/secure_store_failure.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

/// Onde a credencial do terminal mora.
///
/// **Cofre do sistema, nunca `SharedPreferences`** — Keychain no iOS/macOS,
/// EncryptedSharedPreferences no Android, libsecret no Linux. O token dá
/// direito de vender em nome da loja; guardá-lo em texto claro ao lado das
/// preferências seria entregá-lo junto com um backup do dispositivo.
///
/// A interface é a de um repositório para poder ser trocada por um fake em
/// teste — `flutter_secure_storage` depende de canal de plataforma e não roda
/// em `flutter test`.
abstract interface class DeviceCredentialStore {
  Future<DeviceCredential?> read();
  Future<void> write(DeviceCredential credential);
  Future<void> clear();

  /// Grava e apaga um valor descartável para provar que o cofre **aceita
  /// escrita**.
  ///
  /// Existe por causa de um erro de ordem que aconteceu de verdade: o app
  /// resgatava o código de pareamento, o servidor marcava o terminal como
  /// pareado, e só então a gravação local falhava. O código é de **uso único**
  /// — o gerente ficava com um terminal "pareado" no ERP, um PDV que não
  /// pareou, e um código queimado.
  ///
  /// Testar leitura não bastaria: cofre ausente e cofre somente-leitura falham
  /// no mesmo lugar, e é a escrita que precisa funcionar.
  ///
  /// Lança [SecureStoreUnavailableException] quando não dá.
  Future<void> ensureWritable();
}

class SecureDeviceCredentialStore implements DeviceCredentialStore {
  const SecureDeviceCredentialStore(this._storage);

  final FlutterSecureStorage _storage;

  /// Chave versionada: se o formato da credencial mudar, a chave muda junto e
  /// o terminal cai na tela de ativação em vez de tentar ler algo que não
  /// entende mais.
  static const String key = 'pdv.device_credential.v1';

  @override
  Future<DeviceCredential?> read() {
    // Cofre indisponível conta como "não pareado" — cai na ativação, que é o
    // lado seguro. Ver `readFromVault`.
    return readFromVault<DeviceCredential>(() async {
      final String? raw = await _storage.read(key: key);
      if (raw == null || raw.isEmpty) return null;
      try {
        final Object? decoded = jsonDecode(raw);
        if (decoded is! Map<String, dynamic>) return null;
        return DeviceCredential.fromJson(decoded);
      } on FormatException {
        // Valor corrompido é tratado como "não pareado": melhor pedir o código
        // de novo do que travar o app na abertura.
        return null;
      }
    });
  }

  /// ⚠️ **Falha alto de propósito.** Se o cofre não aceitar a credencial, o
  /// terminal não está pareado — e dizer que está faria o código de uso único
  /// ser queimado por nada, com o gerente gerando outro atrás do outro.
  @override
  Future<void> write(DeviceCredential credential) {
    return writeToVault(
      () => _storage.write(key: key, value: jsonEncode(credential.toJson())),
    );
  }

  @override
  Future<void> clear() async {
    // Melhor esforço: se o cofre sumiu, não há o que apagar dele.
    await readFromVault<void>(() => _storage.delete(key: key));
  }

  /// Chave separada da credencial: a sonda não pode sobrescrever nem apagar
  /// por engano um pareamento que já existe.
  static const String probeKey = 'pdv.vault_probe.v1';

  @override
  Future<void> ensureWritable() async {
    await writeToVault(() async {
      await _storage.write(key: probeKey, value: 'ok');
      await _storage.delete(key: probeKey);
    });
  }
}
