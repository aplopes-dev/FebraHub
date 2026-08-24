import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/policies/data/pos_policy_api.dart';
import 'package:citybox_pdv/features/policies/data/secure_pos_policy_store.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';
import 'package:citybox_pdv/features/shared/application/connectivity_controller.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';

final Provider<PosPolicyApi> posPolicyApiProvider = Provider<PosPolicyApi>(
  (Ref ref) => PosPolicyApi(ref.watch(pdvApiClientProvider)),
);

/// Store injetável — `flutter_secure_storage` depende de canal de plataforma e
/// não roda em `flutter test`.
final Provider<PosPolicyStore> posPolicyStoreProvider =
    Provider<PosPolicyStore>(
      (Ref ref) => const SecurePosPolicyStore(FlutterSecureStorage()),
    );

/// A alçada que vale agora.
///
/// **Nunca é `null`**, e essa é a decisão que importa: quem consulta não tem
/// como esquecer de tratar "ainda não carregou". Antes da primeira
/// sincronização o valor é [PosPolicy.restrictive] — na dúvida, pede
/// supervisor. Um provider anulável convidaria a `policy?.requiresSupervisor(…)
/// ?? false`, que é literalmente "sem política, pode tudo".
final NotifierProvider<PosPolicyController, PosPolicy> posPolicyProvider =
    NotifierProvider<PosPolicyController, PosPolicy>(PosPolicyController.new);

class PosPolicyController extends Notifier<PosPolicy> {
  @override
  PosPolicy build() {
    // Segue a credencial em vez de esperar que a tela de ativação e a de
    // configurações lembrem de avisar. São dois lugares distantes, e o que
    // acontece quando um esquece é silencioso: o terminal continua aplicando a
    // alçada da loja anterior.
    ref.listen<DeviceCredential?>(deviceCredentialProvider, (
      DeviceCredential? previous,
      DeviceCredential? next,
    ) {
      if (next == null) {
        unawaited(clear());
        return;
      }
      if (previous?.terminalId != next.terminalId) unawaited(refresh());
    });

    return PosPolicy.restrictive;
  }

  PosPolicyStore get _store => ref.read(posPolicyStoreProvider);

  /// Boot: mostra o cache imediatamente e revalida contra o servidor.
  ///
  /// A ordem é proposital. Ler o cofre é instantâneo e a rede não é; esperar a
  /// resposta para só então saber a alçada deixaria o começo do expediente com
  /// a política restritiva por alguns segundos — e o operador tomaria um pedido
  /// de supervisor num desconto que, segundos depois, passaria sozinho.
  Future<void> hydrate() async {
    final PosPolicy? cached = await _store.read();
    if (cached != null) state = cached;
    await refresh();
  }

  /// Busca a versão do servidor. Falha de rede **não** altera o estado: o
  /// terminal continua com a última alçada conhecida.
  ///
  /// Retorna `true` quando conseguiu falar com o servidor — é o que a
  /// degradação offline vai consultar no M4.
  Future<bool> refresh() async {
    if (ref.read(deviceCredentialProvider) == null) return false;
    try {
      final PosPolicy fresh = await ref.read(posPolicyApiProvider).current();
      state = fresh;
      await _store.write(fresh);
      ref.read(terminalOnlineProvider.notifier).report(online: true);
      return true;
    } on PdvApiException catch (error) {
      if (error.isOffline) {
        ref.read(terminalOnlineProvider.notifier).report(online: false);
      }
      // Silencioso de propósito: não há tela esperando por isto, e um erro
      // visível a cada revalidação treinaria o operador a ignorar aviso.
      // O que a falha custa está no estado, não numa mensagem: a alçada
      // simplesmente continua a de antes.
      return false;
    }
  }

  /// Terminal desativado: volta ao restritivo e apaga o cache. Sem isto, a
  /// alçada do dono anterior sobreviveria a um repareamento em outra loja.
  Future<void> clear() async {
    await _store.clear();
    state = PosPolicy.restrictive;
  }
}
