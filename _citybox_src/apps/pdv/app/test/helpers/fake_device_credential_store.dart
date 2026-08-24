import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

import 'package:citybox_pdv/core/storage/secure_store_failure.dart';
import 'package:citybox_pdv/features/terminal/data/secure_device_credential_store.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

/// Cofre em memória.
///
/// `flutter_secure_storage` fala com canal de plataforma e não existe em
/// `flutter test` — sem este fake, qualquer teste que toque no boot do app
/// quebraria por `MissingPluginException`.
class FakeDeviceCredentialStore implements DeviceCredentialStore {
  FakeDeviceCredentialStore([this._credential]);

  DeviceCredential? _credential;

  /// Quantas vezes gravou — usado para provar que o pareamento persiste
  /// **antes** de publicar no estado.
  int writes = 0;

  /// Quantas vezes limpou — prova que a revogação despareia **uma vez só**,
  /// mesmo quando várias requisições descobrem o fato ao mesmo tempo.
  int clears = 0;

  /// Simula um cofre que não aceita escrita, sem depender do canal nativo.
  bool writable = true;

  @override
  Future<void> ensureWritable() async {
    if (!writable) {
      throw const SecureStoreUnavailableException(
        'cofre de teste indisponível',
      );
    }
  }

  @override
  Future<DeviceCredential?> read() async => _credential;

  @override
  Future<void> write(DeviceCredential credential) async {
    writes++;
    _credential = credential;
  }

  @override
  Future<void> clear() async {
    clears++;
    _credential = null;
  }
}

const DeviceCredential pairedFixture = DeviceCredential(
  token: 'device-token-de-teste',
  terminalId: 'terminal-1',
  terminalName: 'Caixa 1 — Balcão',
  organizationId: 'org-1',
  branchId: 'branch-1',
  organizationName: 'Loja Ilhéus',
  branchName: 'Loja Centro',
);

/// Adapter de HTTP que responde sem rede.
///
/// Preferido a um pacote de mock: o que os testes precisam é decidir status e
/// corpo por caminho, e isso cabe num mapa.
class FakeHttpAdapter implements HttpClientAdapter {
  FakeHttpAdapter(this.responder);

  /// Recebe a requisição e devolve `(status, corpo)`.
  final (int, Map<String, Object?>) Function(RequestOptions options) responder;

  /// Última requisição recebida — para conferir headers e corpo.
  RequestOptions? lastRequest;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    lastRequest = options;
    final (int status, Map<String, Object?> body) = responder(options);
    return ResponseBody.fromString(
      jsonEncode(body),
      status,
      headers: <String, List<String>>{
        Headers.contentTypeHeader: <String>[Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
