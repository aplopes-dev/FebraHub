import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/terminal/data/secure_device_credential_store.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

/// Cliente HTTP compartilhado. Injetável para os testes trocarem por um Dio
/// com `MockAdapter` sem tocar em rede.
final Provider<PdvApiClient> pdvApiClientProvider = Provider<PdvApiClient>(
  (Ref ref) => PdvApiClient(),
);

/// Store injetável — `flutter_secure_storage` depende de canal de plataforma e
/// não roda em `flutter test`, então o teste passa um fake por aqui.
final Provider<DeviceCredentialStore> deviceCredentialStoreProvider =
    Provider<DeviceCredentialStore>(
      (Ref ref) => const SecureDeviceCredentialStore(FlutterSecureStorage()),
    );

/// Estado do pareamento deste terminal.
///
/// `null` significa **não pareado** e é o estado inicial: enquanto o boot não
/// termina de ler o cofre, o app não deve deixar passar para a operação. Quem
/// segura isso é o redirect do router (ver `pdv_router.dart`), não cada tela.
final NotifierProvider<DeviceCredentialController, DeviceCredential?>
deviceCredentialProvider =
    NotifierProvider<DeviceCredentialController, DeviceCredential?>(
      DeviceCredentialController.new,
    );

/// `true` depois que o cofre foi lido pelo menos uma vez.
///
/// Existe para separar "ainda não sei" de "não está pareado" — sem essa
/// distinção, o app pisca a tela de ativação em todo boot de terminal já
/// pareado, enquanto a leitura assíncrona não volta.
final NotifierProvider<DeviceCredentialHydrationController, bool>
deviceCredentialHydratedProvider =
    NotifierProvider<DeviceCredentialHydrationController, bool>(
      DeviceCredentialHydrationController.new,
    );

class DeviceCredentialHydrationController extends Notifier<bool> {
  @override
  bool build() => false;

  void markHydrated() => state = true;
}

/// `true` quando o terminal foi desligado **pelo servidor**, não pelo operador.
///
/// Existe só para a tela de ativação poder explicar por que o app voltou para
/// lá sozinho. Sem isso, o operador que estava no meio do expediente vê a tela
/// de código aparecer do nada e conclui que o app quebrou.
///
/// Distinto de "não pareado": um terminal novo também cai na ativação, e ali
/// não há nada a explicar.
final NotifierProvider<DeviceRevokedController, bool> deviceRevokedProvider =
    NotifierProvider<DeviceRevokedController, bool>(
      DeviceRevokedController.new,
    );

class DeviceRevokedController extends Notifier<bool> {
  @override
  bool build() => false;

  void markRevoked() => state = true;

  /// Limpo ao parear de novo — a explicação vale para o desligamento, não para
  /// sempre.
  void clear() => state = false;
}

class DeviceCredentialController extends Notifier<DeviceCredential?> {
  @override
  DeviceCredential? build() => null;

  DeviceCredentialStore get _store => ref.read(deviceCredentialStoreProvider);
  PdvApiClient get _client => ref.read(pdvApiClientProvider);

  /// Lê o cofre no boot e passa a assinar as requisições.
  ///
  /// ⚠️ **`markHydrated` está no `finally`, e é essencial.** É esse sinal que
  /// tira o app da tela de abertura; se qualquer coisa aqui falhar sem marcar,
  /// o PDV fica preso carregando para sempre, sem mensagem — que foi
  /// exatamente o que aconteceu num Linux sem cofre de credenciais.
  Future<void> hydrate() async {
    try {
      // Liga o detector de revogação antes de qualquer requisição: o cenário
      // comum é o terminal ser desligado no ERP enquanto o PDV está parado na
      // tela de login, e quem descobre é a busca da lista de operadores.
      _client.onDeviceUnauthorized = _handleRevoked;

      final DeviceCredential? stored = await _store.read();
      state = stored;
      _client.setDeviceToken(stored?.token);
      if (stored != null && !stored.hasEstablishmentNames) {
        await _refreshEstablishmentNames();
      }
    } finally {
      ref.read(deviceCredentialHydratedProvider.notifier).markHydrated();
    }
  }

  /// Completa branding em credenciais antigas (sem nomes no cofre).
  ///
  /// Falha de rede é silenciosa: a app bar cai no [DeviceCredential.terminalName]
  /// até a próxima sincronização.
  Future<void> _refreshEstablishmentNames() async {
    final DeviceCredential? current = state;
    if (current == null) return;
    try {
      final Response<Map<String, dynamic>> response = await _client
          .get<Map<String, dynamic>>('/v1/pos/terminal');
      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      final DeviceCredential updated = current.copyWith(
        organizationName: data['organizationName'] as String?,
        branchName: data['branchName'] as String?,
        terminalName: (data['name'] as String?) ?? current.terminalName,
      );
      if (updated.hasEstablishmentNames ||
          updated.terminalName != current.terminalName) {
        await _store.write(updated);
        state = updated;
      }
    } on DioException {
      // Offline: mantém o que já está no cofre.
    }
  }

  /// O servidor recusou a credencial do dispositivo: apaga tudo e deixa o
  /// router levar para a ativação.
  ///
  /// **Idempotente** de propósito. Uma revogação costuma ser descoberta por
  /// várias requisições ao mesmo tempo (lista de operadores, alçada, sync do
  /// cache), e sem esta guarda o app dispararia três limpezas e três
  /// reavaliações de rota para o mesmo fato.
  void _handleRevoked() {
    if (state == null) return;
    ref.read(deviceRevokedProvider.notifier).markRevoked();
    unawaited(forget());
  }

  /// Troca o código de pareamento por uma credencial.
  ///
  /// Lança [PdvApiException] com a mensagem da API — a tela mostra o texto
  /// como veio, porque é ele que diz se o código expirou ou nunca existiu.
  Future<DeviceCredential> pair({
    required String code,
    required String deviceLabel,
  }) async {
    // ⚠️ **Antes de falar com o servidor.** O código é de uso único: resgatar
    // primeiro e descobrir depois que o cofre não grava deixaria o terminal
    // marcado como pareado no ERP, o PDV sem credencial e o código queimado.
    // Conferir aqui custa uma escrita descartável e evita esse desencontro.
    await _store.ensureWritable();

    try {
      final Response<Map<String, dynamic>> response = await _client
          .post<Map<String, dynamic>>(
            '/v1/pos-terminals/pair/redeem',
            data: <String, Object?>{
              'code': code.trim().toUpperCase(),
              'deviceLabel': deviceLabel,
            },
          );

      final Map<String, dynamic> data =
          response.data!['data']! as Map<String, dynamic>;
      final Map<String, dynamic> terminal =
          data['terminal']! as Map<String, dynamic>;

      final DeviceCredential credential = DeviceCredential(
        token: data['deviceToken']! as String,
        terminalId: terminal['id']! as String,
        terminalName: terminal['name']! as String,
        organizationId: terminal['organizationId']! as String,
        branchId: terminal['branchId']! as String,
        organizationName: terminal['organizationName'] as String?,
        branchName: terminal['branchName'] as String?,
      );

      // Grava **antes** de publicar no estado: se a escrita no cofre falhar, o
      // app não pode achar que está pareado — o código já foi consumido e não
      // serve de novo.
      await _store.write(credential);
      _client.setDeviceToken(credential.token);
      ref.read(deviceRevokedProvider.notifier).clear();
      state = credential;
      return credential;
    } on DioException catch (error) {
      throw PdvApiException.from(error);
    }
  }

  /// Apaga a credencial local — desativar o terminal neste dispositivo.
  ///
  /// Não fala com a API de propósito: revogar do lado do servidor é ação do
  /// gerente no ERP. Aqui é só o dispositivo esquecendo quem era.
  Future<void> forget() async {
    await _store.clear();
    _client.setDeviceToken(null);
    state = null;
  }
}
