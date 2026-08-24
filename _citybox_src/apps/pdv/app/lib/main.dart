import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:window_manager/window_manager.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/platform/app_platform.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/catalog/application/catalog_controller.dart';
import 'package:citybox_pdv/features/credit/application/credit_controller.dart';
import 'package:citybox_pdv/features/customer/application/customer_catalog_controller.dart';
import 'package:citybox_pdv/features/fiscal/application/pos_fiscal_settings_controller.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/operators/presentation/operator_lock_overlay.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/presentation/widgets/inactivity_locker.dart';
import 'package:citybox_pdv/features/payment/application/payment_methods_controller.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/refund/application/refund_controller.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/features/shared/application/reset_open_sale.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await initializeDateFormatting('pt_BR');

  if (AppPlatform.isDesktop) {
    await _setUpDesktopWindow();
  }

  runApp(const ProviderScope(child: PdvApp()));
}

Future<void> _setUpDesktopWindow() async {
  await windowManager.ensureInitialized();

  const WindowOptions options = WindowOptions(
    size: Size(1280, 800),
    minimumSize: Size(1024, 640),
    center: true,
    title: 'Citybox PDV',
    titleBarStyle: TitleBarStyle.hidden,
    backgroundColor: Colors.transparent,
  );

  await windowManager.waitUntilReadyToShow(options, () async {
    await windowManager.show();
    await windowManager.focus();
  });
}

/// Raiz do aplicativo.
class PdvApp extends ConsumerStatefulWidget {
  const PdvApp({super.key});

  @override
  ConsumerState<PdvApp> createState() => _PdvAppState();
}

class _PdvAppState extends ConsumerState<PdvApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Credencial **antes** do resto: no Linux o cofre é um JSON único com
      // read-modify-write (ver `runInVault`). Ler/gravar alçada e cache em
      // paralelo com a credencial já perdia o pareamento entre um boot e outro.
      unawaited(_hydrateBoot());
    });
  }

  Future<void> _hydrateBoot() async {
    await ref.read(deviceCredentialProvider.notifier).hydrate();
    unawaited(ref.read(posPolicyProvider.notifier).hydrate());
    unawaited(ref.read(posFiscalSettingsProvider.notifier).hydrate());
    unawaited(ref.read(operatorSessionProvider.notifier).hydrate());
    unawaited(
      ref
          .read(operatorCacheProvider.notifier)
          .hydrate()
          .then((_) => ref.read(operatorCacheProvider.notifier).sync()),
    );
    unawaited(ref.read(moduleVisibilityProvider.notifier).hydrate());
    unawaited(ref.read(catalogProvider.notifier).hydrate());
    unawaited(ref.read(customerCatalogProvider.notifier).hydrate());
    unawaited(ref.read(paymentMethodsProvider.notifier).hydrate());
    unawaited(ref.read(cashShiftProvider.notifier).hydrate());
    unawaited(ref.read(terminalSettingsProvider.notifier).hydrate());
    unawaited(ref.read(salonProvider.notifier).hydrate());
    unawaited(ref.read(refundProvider.notifier).hydrate());
    unawaited(ref.read(creditProvider.notifier).hydrate());
  }

  @override
  Widget build(BuildContext context) {
    final GoRouter router = ref.watch(pdvRouterProvider);
    final bool largeScrollbars =
        ref.watch(terminalSettingsProvider).largeScrollbars;
    // Sem este watch o listen morre e o carrinho vaza entre organizações.
    ref.watch(openSaleResetBindingProvider);

    return MaterialApp.router(
      title: 'Citybox PDV',
      debugShowCheckedModeBanner: false,
      theme: PdvTheme.data(largeScrollbars: largeScrollbars),
      locale: const Locale('pt', 'BR'),
      supportedLocales: const <Locale>[Locale('pt', 'BR')],
      localizationsDelegates: const <LocalizationsDelegate<Object>>[
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      routerConfig: router,
      // Acima do `Navigator`: o bloqueio cobre também diálogos abertos, que
      // uma rota nova deixaria visíveis por baixo. E a contagem de inatividade
      // enxerga toque e tecla de qualquer tela.
      builder:
          (BuildContext context, Widget? child) => InactivityLocker(
            child: OperatorLockOverlay(child: child ?? const SizedBox.shrink()),
          ),
    );
  }
}
