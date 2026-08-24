import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:citybox_pdv/core/crypto/pdv_pin_hasher.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/operators/data/pos_operator_api.dart';
import 'package:citybox_pdv/features/operators/data/secure_operator_cache_store.dart';
import 'package:citybox_pdv/features/operators/domain/operator_cache.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/shared/application/connectivity_controller.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

final Provider<PosOperatorApi> posOperatorApiProvider =
    Provider<PosOperatorApi>(
      (Ref ref) => PosOperatorApi(ref.watch(pdvApiClientProvider)),
    );

/// Store injetável — `flutter_secure_storage` não roda em `flutter test`.
final Provider<OperatorCacheStore> operatorCacheStoreProvider =
    Provider<OperatorCacheStore>(
      (Ref ref) => const SecureOperatorCacheStore(FlutterSecureStorage()),
    );

/// Relógio injetável: os testes de validade precisam controlar "agora".
final Provider<DateTime Function()> operatorClockProvider =
    Provider<DateTime Function()>((Ref ref) => DateTime.now);

/// Operadores que a tela de login oferece — os ativos desta unidade.
final FutureProvider<List<PosOperator>> terminalOperatorsProvider =
    FutureProvider<List<PosOperator>>((Ref ref) async {
      // Depende da credencial: trocar de terminal tem que trocar a lista.
      ref.watch(deviceCredentialProvider);
      try {
        return await ref.watch(posOperatorApiProvider).list();
      } on PdvApiException catch (error) {
        // Sem rede, a lista sai do cache — senão a tela de login ficaria vazia
        // justamente quando o login offline existe para ser usado.
        if (!error.isOffline) rethrow;
        final OperatorCache? cache =
            await ref.watch(operatorCacheStoreProvider).read();
        if (cache == null) rethrow;
        return cache.operators.map((CachedOperator c) => c.operator).toList();
      }
    });

/// Estado do cache offline — o que a barra de título mostra e o que a
/// degradação consulta.
final NotifierProvider<OperatorCacheController, OperatorCache?>
operatorCacheProvider =
    NotifierProvider<OperatorCacheController, OperatorCache?>(
      OperatorCacheController.new,
    );

class OperatorCacheController extends Notifier<OperatorCache?> {
  @override
  OperatorCache? build() {
    // Segue a credencial: terminal revogado ou desativado não pode continuar
    // guardando os hashes de PIN da equipe daquela loja. Vale para o desligar
    // manual e para a revogação vinda do servidor.
    ref.listen<DeviceCredential?>(deviceCredentialProvider, (
      DeviceCredential? previous,
      DeviceCredential? next,
    ) {
      if (next == null) unawaited(clear());
    });
    return null;
  }

  OperatorCacheStore get _store => ref.read(operatorCacheStoreProvider);

  /// Lê o cofre no boot. Não busca rede — quem sincroniza é [sync].
  Future<void> hydrate() async {
    state = await _store.read();
  }

  /// Baixa o pacote de `GET /v1/pos/operators/sync` e grava.
  ///
  /// Silencioso ao falhar: acontece no boot, depois de cada login online e a
  /// cada volta de rede, e um erro visível a cada tentativa treinaria o
  /// operador a ignorar aviso. O custo da falha aparece no **estado** — cache
  /// envelhecendo —, que a barra de título mostra.
  Future<bool> sync() async {
    if (ref.read(deviceCredentialProvider) == null) return false;
    try {
      final OperatorCache cache = await ref.read(posOperatorApiProvider).sync();
      await _store.write(cache);
      state = cache;
      ref.read(terminalOnlineProvider.notifier).report(online: true);
      return true;
    } on PdvApiException catch (error) {
      if (error.isOffline) {
        ref.read(terminalOnlineProvider.notifier).report(online: false);
      }
      return false;
    }
  }

  /// Terminal desativado: o aparelho não pode continuar guardando as
  /// credenciais da equipe de uma loja que não é mais dele.
  Future<void> clear() async {
    await _store.clear();
    state = null;
  }
}

/// Quem está operando o caixa agora. `null` = ninguém entrou.
final NotifierProvider<OperatorSessionController, PosOperator?>
operatorSessionProvider =
    NotifierProvider<OperatorSessionController, PosOperator?>(
      OperatorSessionController.new,
    );

/// Tela bloqueada por cima, com a sessão **intacta**.
///
/// Estado separado da sessão de propósito: bloquear não é sair. O turno segue
/// aberto, o carrinho segue montado, e desbloquear devolve exatamente o que
/// estava na tela.
final NotifierProvider<OperatorLockController, bool> operatorLockedProvider =
    NotifierProvider<OperatorLockController, bool>(OperatorLockController.new);

class OperatorLockController extends Notifier<bool> {
  @override
  bool build() => false;

  void lock() => state = true;
  void unlock() => state = false;
}

class OperatorSessionController extends Notifier<PosOperator?> {
  @override
  PosOperator? build() {
    // Sem terminal não há sessão possível. Sem isto, um terminal revogado no
    // meio do expediente deixaria o operador logado numa loja que já não é a
    // dele — e o gate de turno o manteria dentro do app.
    ref.listen<DeviceCredential?>(deviceCredentialProvider, (
      DeviceCredential? previous,
      DeviceCredential? next,
    ) {
      if (next == null) clear();
    });
    return null;
  }

  /// Tentativas erradas contadas **no dispositivo**, além do contador do
  /// servidor.
  ///
  /// Não é redundância: no caminho offline o servidor não é consultado, e sem
  /// contador local um PIN de 4 dígitos ficaria exposto à força bruta manual —
  /// dez mil combinações num aparelho sem rede, sem nada contando.
  Map<String, int> _localAttempts = <String, int>{};

  int attemptsFor(String code) => _localAttempts[code] ?? 0;

  /// Recupera o contador gravado. Chamado no boot, junto das outras
  /// hidratações.
  Future<void> hydrate() async {
    _localAttempts = await ref.read(operatorCacheStoreProvider).readAttempts();
  }

  /// Entra com código e PIN. Erro sobe como [PdvApiException] com a mensagem
  /// que a API mandou — ou, sem rede, a do caminho offline.
  Future<PosOperator> signIn({
    required String code,
    required String pin,
  }) async {
    try {
      final PosOperator operator = await ref
          .read(posOperatorApiProvider)
          .authenticate(code: code, pin: pin);
      _succeed(code, operator);
      ref.read(terminalOnlineProvider.notifier).report(online: true);
      // Aproveita o terminal online para renovar o pacote offline. Sem isto o
      // cache só se renovaria no boot — e um terminal que fica dias ligado
      // chegaria à queda de rede com o cache já vencido.
      unawaited(ref.read(operatorCacheProvider.notifier).sync());
      return operator;
    } on PdvApiException catch (error) {
      // ⚠️ **Só cai no cache quando não chegou ao servidor.** Um 401 é o
      // servidor dizendo que o PIN não vale; consultar o cache depois disso
      // ressuscitaria credencial revogada — exatamente o operador que a loja
      // acabou de desligar.
      if (!error.isOffline) {
        // O servidor respondeu — recusando, mas respondeu. Continua online.
        ref.read(terminalOnlineProvider.notifier).report(online: true);
        _fail(code);
        rethrow;
      }
      ref.read(terminalOnlineProvider.notifier).report(online: false);
      return _signInOffline(code: code, pin: pin);
    }
  }

  Future<PosOperator> _signInOffline({
    required String code,
    required String pin,
  }) async {
    final OperatorCache? cache =
        await ref.read(operatorCacheStoreProvider).read();
    final DateTime now = ref.read(operatorClockProvider)();

    if (cache == null) {
      _fail(code);
      throw const PdvApiException(
        'Sem conexão e sem dados salvos neste terminal. '
        'Conecte à rede da loja para entrar.',
        isOffline: true,
      );
    }
    if (cache.isExpired(now)) {
      _fail(code);
      throw const PdvApiException(
        'Os dados salvos neste terminal venceram. '
        'Conecte à rede da loja para sincronizar.',
        isOffline: true,
      );
    }

    // Mesma mensagem para código inexistente e PIN errado — é o contrato da
    // rota online, e o caminho offline não pode ser mais informativo que ela.
    const PdvApiException wrong = PdvApiException(
      'Código ou PIN incorreto',
      statusCode: 401,
    );

    final CachedOperator? cached = cache.findByCode(code);
    if (cached == null) {
      _fail(code);
      throw wrong;
    }

    final bool ok = await PdvPinHasher.verifyOffThread(pin, cached.pinHash);
    if (!ok) {
      _fail(code);
      throw wrong;
    }

    _succeed(code, cached.operator);
    return cached.operator;
  }

  void _succeed(String code, PosOperator operator) {
    _localAttempts = <String, int>{..._localAttempts}..remove(code);
    _persistAttempts();
    ref.read(operatorLockedProvider.notifier).unlock();
    state = operator;
  }

  void _fail(String code) {
    _localAttempts = <String, int>{
      ..._localAttempts,
      code: attemptsFor(code) + 1,
    };
    _persistAttempts();
  }

  /// Gravação em segundo plano: o resultado do login não pode esperar o cofre,
  /// e um erro de escrita aqui não muda o que já foi decidido.
  void _persistAttempts() {
    unawaited(
      ref.read(operatorCacheStoreProvider).writeAttempts(_localAttempts),
    );
  }

  /// Desbloqueia a tela conferindo o PIN de **quem já está na sessão**.
  ///
  /// Passa pelo mesmo caminho do login: bloquear a tela não pode virar uma
  /// autenticação mais fraca que a entrada normal — inclusive offline.
  Future<void> unlockWith(String pin) async {
    final PosOperator? current = state;
    if (current == null) return;
    await signIn(code: current.code, pin: pin);
  }

  /// Troca de operador: o turno **continua aberto**, e as vendas seguintes
  /// passam a ser do novo. Não é logout.
  void switchOperator() {
    ref.read(operatorLockedProvider.notifier).unlock();
    state = null;
  }

  /// Terminal desativado ou credencial revogada: não há mais sessão possível.
  void clear() {
    ref.read(operatorLockedProvider.notifier).unlock();
    state = null;
  }
}
