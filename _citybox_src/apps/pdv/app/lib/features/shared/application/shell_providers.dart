import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:package_info_plus/package_info_plus.dart';

import 'package:citybox_pdv/core/platform/app_platform.dart';
import 'package:citybox_pdv/features/fiscal/application/pos_fiscal_settings_controller.dart';
import 'package:citybox_pdv/features/fiscal/domain/pos_fiscal_settings.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/operator_cache.dart';
import 'package:citybox_pdv/features/shared/application/connectivity_controller.dart';
import 'package:citybox_pdv/features/shared/domain/sync_status.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';

/// Se a barra de título própria deve ser desenhada.
///
/// A resposta vem da plataforma, mas passa por um provider em vez de ser
/// consultada direto no widget: a barra fala com o gerenciador de janelas e
/// com o bundle do app, canais que não existem num teste de widget. Com o
/// provider, um teste sobrescreve para `false` e exercita a tela sem precisar
/// simular o sistema operacional inteiro.
final Provider<bool> showCustomTitleBarProvider = Provider<bool>((Ref ref) {
  return AppPlatform.isDesktop;
});

/// Relógio do caixa, com precisão de segundo.
///
/// `Stream` em vez de um `Timer` dentro de um widget: assim o valor tem um dono
/// só e qualquer parte da tela pode observá-lo sem criar um segundo timer.
/// O Riverpod cancela a inscrição quando ninguém mais observa.
final StreamProvider<DateTime> clockProvider = StreamProvider<DateTime>((
  Ref ref,
) {
  return Stream<DateTime>.periodic(
    const Duration(seconds: 1),
    (_) => DateTime.now(),
  );
});

/// Versão do app, lida do bundle.
///
/// Vem do `package_info_plus` e não de uma constante em código justamente para
/// não mentir: uma constante esquecida faz o suporte diagnosticar a versão
/// errada, que é pior que não mostrar versão nenhuma.
final FutureProvider<String> appVersionProvider = FutureProvider<String>((
  Ref ref,
) async {
  final PackageInfo info = await PackageInfo.fromPlatform();
  return 'v${info.version}';
});

/// **Exceção** ao título derivado da rota, exibido no centro da barra.
///
/// O nome da tela sai de `pdvPageTitleForLocation` — ver `pdv_router.dart`.
/// Este provider existe só para as telas empurradas pelo `Navigator`, fora do
/// `go_router` (hoje: o cadastro de cliente aberto pelo seletor), onde a rota
/// não muda e portanto não tem título a oferecer. `null` = derive da rota.
///
/// Quem escreve aqui **tem que limpar depois** — é o que `pushWithPageTitle`
/// faz. Nenhuma tela deve chamar `setTitle` antes de um `push`/`go`: foi
/// exatamente esse padrão que deixava o título velho na barra ao voltar.
final NotifierProvider<PageTitleOverrideNotifier, String?>
pageTitleOverrideProvider =
    NotifierProvider<PageTitleOverrideNotifier, String?>(
      PageTitleOverrideNotifier.new,
    );

class PageTitleOverrideNotifier extends Notifier<String?> {
  @override
  String? build() => null;

  void setTitle(String? title) => state = title;
}

/// Status de rede, fiscal e fila de sincronização.
///
/// **`network` e `offlineCacheExpiresAt` são reais** desde o M4: saem do
/// resultado das requisições que o app já faz (`terminalOnlineProvider`) e do
/// pacote de login offline.
///
/// **`fiscal`** lê `GET /v1/pos/fiscal-settings`, mas **nunca fica `ok`** até
/// existir emissão real no PDV: modelo configurado → `degraded`; sem modelo →
/// `down`. Mentir "Sefaz verde" treinava o operador a ignorar o indicador.
///
/// 🚧 **`pendingSales` continua fixture** (fila offline ainda não existe).
final Provider<SyncStatus> syncStatusProvider = Provider<SyncStatus>((Ref ref) {
  final bool online = ref.watch(terminalOnlineProvider);
  final OperatorCache? cache = ref.watch(operatorCacheProvider);
  final PosFiscalSettings fiscal = ref.watch(posFiscalSettingsProvider);

  return SyncStatus(
    network: online ? ChannelHealth.ok : ChannelHealth.down,
    fiscal:
        fiscal.posDocumentModel == null
            ? ChannelHealth.down
            : ChannelHealth.degraded,
    pendingSales: 0,
    offlineCacheExpiresAt: cache?.expiresAt,
  );
});

/// Nome do estabelecimento nas app bars (unidade → empresa → terminal).
final Provider<String> establishmentNameProvider = Provider<String>((Ref ref) {
  final credential = ref.watch(deviceCredentialProvider);
  return credential?.establishmentDisplayName ?? 'Loja';
});
