import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'operator_fixture.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_close_page.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_hub_page.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_movement_page.dart';
import 'package:citybox_pdv/features/counter/presentation/counter_page.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_totals_panel.dart';
import 'package:citybox_pdv/features/credit/presentation/credit_page.dart';
import 'package:citybox_pdv/features/delivery/presentation/delivery_new_page.dart';
import 'package:citybox_pdv/features/delivery/presentation/delivery_orders_page.dart';
import 'package:citybox_pdv/features/service/presentation/service_queue_page.dart';
import 'package:citybox_pdv/features/tables/presentation/tables_page.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/operators/presentation/operator_lock_overlay.dart';
import 'package:citybox_pdv/features/operators/presentation/operator_login_page.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';
import 'package:citybox_pdv/features/terminal/presentation/activate_terminal_page.dart';
import 'package:citybox_pdv/features/tabs/presentation/tabs_page.dart';
import 'package:citybox_pdv/features/customer/presentation/customer_form_page.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/payment/presentation/payment_page.dart';
import 'package:citybox_pdv/features/payment/presentation/sale_completed_page.dart';
import 'package:citybox_pdv/features/price_check/presentation/price_check_page.dart';
import 'package:citybox_pdv/features/refund/presentation/refund_page.dart';
import 'package:citybox_pdv/features/sales_history/presentation/sale_detail_page.dart';
import 'package:citybox_pdv/features/sales_history/presentation/sales_history_page.dart';
import 'package:citybox_pdv/features/settings/presentation/settings_page.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/shared/presentation/starting_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'catalog_fixture.dart';
import 'fake_device_credential_store.dart';
import 'fake_pos_cash_session_api.dart';
import 'payment_methods_fixture.dart';
import 'policy_fixture.dart';
import 'sellers_fixture.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';

bool _requiresOpenShift(String loc) {
  return loc == PdvRoutes.counter ||
      loc == PdvRoutes.payment ||
      loc == PdvRoutes.cashMovement ||
      loc == PdvRoutes.cashClose ||
      loc == PdvRoutes.salesHistory ||
      loc.startsWith('${PdvRoutes.salesHistory}/') ||
      loc == PdvRoutes.priceCheck ||
      loc == PdvRoutes.refund ||
      loc == PdvRoutes.credit ||
      loc == PdvRoutes.tables ||
      loc == PdvRoutes.tabs ||
      loc == PdvRoutes.service ||
      loc == PdvRoutes.deliveryNew ||
      loc == PdvRoutes.deliveryOrders;
}

bool _initialLocationRequiresOpenShift(String location) {
  return _requiresOpenShift(location);
}

/// Harness de widget com `GoRouter` — necessário para `context.go`/`push`.
///
/// Por padrão injeta um turno **aberto**, um terminal **pareado** e um
/// operador **logado**, para os testes não caírem nos três guards do router.
///
/// O redirect aqui espelha o do router real (`createPdvRouter`), na mesma
/// ordem — credencial antes de turno. Se divergirem, os testes passam a cobrir
/// um app que não existe.
Future<ProviderContainer> pumpWithRouter(
  WidgetTester tester, {
  String initialLocation = PdvRoutes.home,
  List<Override> overrides = const <Override>[],
  Size size = const Size(1400, 900),
  Widget? homeOverride,
  bool withOpenShift = true,
  bool withPairedTerminal = true,
  bool withOperator = true,
  /// Quem entra na sessão (e abre o turno). Default: [testOperator].
  PosOperator sessionOperator = testOperator,
  FakeDeviceCredentialStore? credentialStore,
  FakePosOperatorApi? operatorApi,
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  SharedPreferences.setMockInitialValues(<String, Object>{});
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  final SharedPreferencesCashShiftStore store = SharedPreferencesCashShiftStore(
    prefs,
  );

  final FakePosOperatorApi fakeOperatorApi =
      operatorApi ??
      FakePosOperatorApi(
        operators: <PosOperator>[
          sessionOperator,
          if (sessionOperator.id != testSupervisor.id) testSupervisor,
          if (sessionOperator.id != testCashier.id &&
              sessionOperator.id != testOperator.id)
            testOperator,
        ],
      );

  final FakeDeviceCredentialStore deviceStore =
      credentialStore ??
      FakeDeviceCredentialStore(withPairedTerminal ? pairedFixture : null);

  late ProviderContainer container;
  final ValueNotifier<int> refresh = ValueNotifier<int>(0);
  GoRouter? testRouter;
  addTearDown(refresh.dispose);

  await tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[
        showCustomTitleBarProvider.overrideWithValue(false),
        cashShiftStoreProvider.overrideWithValue(store),
        posCashSessionApiProvider.overrideWithValue(FakePosCashSessionApi()),
        deviceCredentialStoreProvider.overrideWithValue(deviceStore),
        posOperatorApiProvider.overrideWithValue(fakeOperatorApi),
        // Cofres em memória: `flutter_secure_storage` não roda em teste, e o
        // caminho de login toca os dois.
        operatorCacheStoreProvider.overrideWithValue(FakeOperatorCacheStore()),
        posPolicyStoreProvider.overrideWithValue(FakePosPolicyStore()),
        ...fixtureCatalogOverrides(),
        ...fixturePaymentMethodsOverrides(),
        ...fixtureSellersOverrides(),
        ...overrides,
      ],
      child: Consumer(
        builder: (BuildContext context, WidgetRef ref, _) {
          final GoRouter router = GoRouter(
            initialLocation: initialLocation,
            refreshListenable: refresh,
            redirect: (BuildContext context, GoRouterState state) {
              final String loc = state.matchedLocation;

              if (!ref.read(deviceCredentialHydratedProvider)) {
                return loc == PdvRoutes.starting ? null : PdvRoutes.starting;
              }
              if (ref.read(deviceCredentialProvider) == null) {
                return loc == PdvRoutes.activateTerminal
                    ? null
                    : PdvRoutes.activateTerminal;
              }
              if (loc == PdvRoutes.activateTerminal) {
                final bool signedInLeavingActivate =
                    ref.read(operatorSessionProvider) != null;
                return signedInLeavingActivate
                    ? PdvRoutes.home
                    : PdvRoutes.operatorLogin;
              }
              if (ref.read(operatorSessionProvider) == null) {
                return loc == PdvRoutes.operatorLogin
                    ? null
                    : PdvRoutes.operatorLogin;
              }
              if (loc == PdvRoutes.operatorLogin) {
                return PdvRoutes.home;
              }
              if (loc == PdvRoutes.starting) {
                return PdvRoutes.home;
              }

              if (!_requiresOpenShift(loc)) {
                return null;
              }
              final bool open = ref.read(cashShiftProvider)?.isOpen ?? false;
              if (open) {
                return null;
              }
              return '${PdvRoutes.cash}?intent=open';
            },
            routes: <RouteBase>[
              GoRoute(
                path: PdvRoutes.home,
                builder: (BuildContext context, GoRouterState state) {
                  // Espelha o router real, que envolve a Home no PdvScaffold —
                  // é de lá que vêm a app bar e o menu lateral.
                  return homeOverride ??
                      const PdvScaffold(showBack: false, body: HomePage());
                },
              ),
              GoRoute(
                path: PdvRoutes.starting,
                builder: (BuildContext context, GoRouterState state) {
                  return const StartingPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.activateTerminal,
                builder: (BuildContext context, GoRouterState state) {
                  return const ActivateTerminalPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.operatorLogin,
                builder: (BuildContext context, GoRouterState state) {
                  return const OperatorLoginPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.counter,
                builder: (BuildContext context, GoRouterState state) {
                  return const CounterPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.payment,
                builder: (BuildContext context, GoRouterState state) {
                  return const PaymentPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.saleCompleted,
                builder: (BuildContext context, GoRouterState state) {
                  return const SaleCompletedPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.customerForm,
                builder: (BuildContext context, GoRouterState state) {
                  return const CustomerFormPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.cash,
                builder: (BuildContext context, GoRouterState state) {
                  return CashHubPage(
                    intentOpen: state.uri.queryParameters['intent'] == 'open',
                  );
                },
              ),
              GoRoute(
                path: PdvRoutes.cashMovement,
                builder: (BuildContext context, GoRouterState state) {
                  return const CashMovementPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.cashClose,
                builder: (BuildContext context, GoRouterState state) {
                  return const CashClosePage();
                },
              ),
              GoRoute(
                path: PdvRoutes.salesHistory,
                builder: (BuildContext context, GoRouterState state) {
                  return const SalesHistoryPage();
                },
                routes: <RouteBase>[
                  GoRoute(
                    path: ':saleId',
                    builder: (BuildContext context, GoRouterState state) {
                      return SaleDetailPage(
                        saleId: state.pathParameters['saleId']!,
                      );
                    },
                  ),
                ],
              ),
              GoRoute(
                path: PdvRoutes.settings,
                builder: (BuildContext context, GoRouterState state) {
                  return const SettingsPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.priceCheck,
                builder: (BuildContext context, GoRouterState state) {
                  return const PriceCheckPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.refund,
                builder: (BuildContext context, GoRouterState state) {
                  return const RefundPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.credit,
                builder: (BuildContext context, GoRouterState state) {
                  return const CreditPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.tables,
                builder: (BuildContext context, GoRouterState state) {
                  return const TablesPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.tabs,
                builder: (BuildContext context, GoRouterState state) {
                  return const TabsPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.service,
                builder: (BuildContext context, GoRouterState state) {
                  return const ServiceQueuePage();
                },
              ),
              GoRoute(
                path: PdvRoutes.deliveryNew,
                builder: (BuildContext context, GoRouterState state) {
                  return const DeliveryNewPage();
                },
              ),
              GoRoute(
                path: PdvRoutes.deliveryOrders,
                builder: (BuildContext context, GoRouterState state) {
                  return const DeliveryOrdersPage();
                },
              ),
              GoRoute(
                path: '/_totals',
                builder: (BuildContext context, GoRouterState state) {
                  return const Scaffold(body: CounterTotalsPanel());
                },
              ),
            ],
          );
          container = ProviderScope.containerOf(context);
          testRouter = router;
          addTearDown(router.dispose);
          return MaterialApp.router(
            theme: PdvTheme.data(),
            routerConfig: router,
            // Espelha o `builder` do `main.dart`: o bloqueio de tela mora
            // acima do Navigator. Sem isto o teste cobriria um app sem
            // bloqueio nenhum.
            builder:
                (BuildContext context, Widget? child) => OperatorLockOverlay(
                  child: child ?? const SizedBox.shrink(),
                ),
          );
        },
      ),
    ),
  );

  // Espelha o `ref.listen` do router real: parear e revogar mudam a rota
  // permitida, e sem reavaliar o redirect o app ficaria na tela anterior.
  container.listen<PosOperator?>(
    operatorSessionProvider,
    (_, __) => refresh.value++,
  );
  container.listen<DeviceCredential?>(
    deviceCredentialProvider,
    (_, __) => refresh.value++,
  );
  container.listen<bool>(
    deviceCredentialHydratedProvider,
    (_, __) => refresh.value++,
  );

  await container.read(deviceCredentialProvider.notifier).hydrate();
  refresh.value++;
  await tester.pump();
  if (withOperator) {
    // Entra pelo caminho real (código + PIN contra a API fake), em vez de
    // plantar o estado: assim o teste exercita o mesmo fluxo do app.
    await container
        .read(operatorSessionProvider.notifier)
        .signIn(code: sessionOperator.code, pin: fakeOperatorApi.acceptedPin);
    refresh.value++;
    await tester.pump();
  }

  await container.read(cashShiftProvider.notifier).hydrate();
  if (withOpenShift) {
    await container
        .read(cashShiftProvider.notifier)
        .openShift(openingFloatCents: 10000, operator: sessionOperator);
    refresh.value++;
    await tester.pump();
    if (_initialLocationRequiresOpenShift(initialLocation)) {
      testRouter!.go(initialLocation);
    }
  }
  // O gate de credencial roda depois da hidratação: reposiciona na rota pedida
  // para o teste começar onde disse que começaria.
  if (withPairedTerminal && withOperator && initialLocation != PdvRoutes.home) {
    testRouter!.go(initialLocation);
  }

  await tester.pumpAndSettle();
  return container;
}

/// Helper for tests that need an explicit open CashShift state.
CashShift openShiftFixture() {
  return CashShift(
    id: 'test-shift',
    status: CashShiftStatus.open,
    openedAt: DateTime.utc(2026, 8, 5),
    openingFloatCents: 10000,
    movements: const <CashMovement>[],
    sales: const <SaleRecord>[],
  );
}
