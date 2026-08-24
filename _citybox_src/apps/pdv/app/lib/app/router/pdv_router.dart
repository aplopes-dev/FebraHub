import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_close_page.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_hub_page.dart';
import 'package:citybox_pdv/features/cash/presentation/cash_movement_page.dart';
import 'package:citybox_pdv/features/counter/presentation/counter_page.dart';
import 'package:citybox_pdv/features/credit/presentation/credit_page.dart';
import 'package:citybox_pdv/features/customer/presentation/customer_form_page.dart';
import 'package:citybox_pdv/features/delivery/presentation/delivery_new_page.dart';
import 'package:citybox_pdv/features/delivery/presentation/delivery_orders_page.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/presentation/operator_login_page.dart';
import 'package:citybox_pdv/features/payment/presentation/payment_page.dart';
import 'package:citybox_pdv/features/payment/presentation/sale_completed_page.dart';
import 'package:citybox_pdv/features/price_check/presentation/price_check_page.dart';
import 'package:citybox_pdv/features/refund/presentation/refund_page.dart';
import 'package:citybox_pdv/features/sales_history/presentation/sale_detail_page.dart';
import 'package:citybox_pdv/features/sales_history/presentation/sales_history_page.dart';
import 'package:citybox_pdv/features/service/presentation/service_queue_page.dart';
import 'package:citybox_pdv/features/settings/presentation/settings_page.dart';
import 'package:citybox_pdv/features/shared/presentation/starting_page.dart';
import 'package:citybox_pdv/features/tables/application/salon_controller.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/presentation/activate_terminal_page.dart';
import 'package:citybox_pdv/features/tabs/presentation/tabs_page.dart';
import 'package:citybox_pdv/features/tables/presentation/tables_page.dart';

/// Rotas nomeadas do PDV.
abstract final class PdvRoutes {
  static const String home = '/';
  static const String counter = '/counter';
  static const String payment = '/payment';
  static const String saleCompleted = '/sale-completed';
  static const String customerForm = '/customer/form';
  static const String cash = '/cash';
  static const String cashMovement = '/cash/movement';
  static const String cashClose = '/cash/close';
  static const String salesHistory = '/sales';
  static const String settings = '/settings';
  static const String tables = '/tables';
  static const String tabs = '/tabs';
  static const String service = '/service';
  static const String deliveryNew = '/delivery/new';
  static const String deliveryOrders = '/delivery/orders';
  static const String priceCheck = '/price-check';
  static const String refund = '/refund';
  static const String credit = '/credit';

  /// Tela de abertura, enquanto os guards ainda não sabem decidir.
  ///
  /// É a `initialLocation`, e nenhuma navegação leva de volta para cá — só o
  /// boot passa por ela.
  static const String starting = '/starting';

  /// Ativação do terminal — única rota alcançável sem credencial.
  static const String activateTerminal = '/terminal/activate';

  /// Entrada do operador — alcançável com terminal pareado e sem sessão.
  static const String operatorLogin = '/operator/login';
}

const Set<String> _shiftProtectedPrefixes = <String>{
  PdvRoutes.counter,
  PdvRoutes.payment,
  PdvRoutes.cashMovement,
  PdvRoutes.cashClose,
  PdvRoutes.salesHistory,
  PdvRoutes.tables,
  PdvRoutes.tabs,
  PdvRoutes.service,
  PdvRoutes.deliveryNew,
  PdvRoutes.deliveryOrders,
  PdvRoutes.priceCheck,
  PdvRoutes.refund,
  PdvRoutes.credit,
};

bool _requiresOpenShift(String location) {
  if (location == PdvRoutes.saleCompleted) {
    return false;
  }
  for (final String prefix in _shiftProtectedPrefixes) {
    if (location == prefix || location.startsWith('$prefix/')) {
      return true;
    }
  }
  return false;
}

GoRouter createPdvRouter(Ref ref, Listenable refreshListenable) {
  return GoRouter(
    // Abre na tela de abertura, **não** na Home: enquanto o cofre não foi
    // lido o redirect não decide nada, e o que estiver como `initialLocation`
    // é o que o operador vê nesse intervalo. Com a Home ali, o PDV piscava a
    // tela operacional antes de saber quem estava no caixa.
    initialLocation: PdvRoutes.starting,
    refreshListenable: refreshListenable,
    // Ordem única e explícita dos guards: **credencial → operador → turno**.
    // Três
    // redirects competindo (cada um querendo levar para a sua tela) produziria
    // laço de navegação — por isso a checagem de credencial vem primeiro e
    // retorna cedo.
    redirect: (BuildContext context, GoRouterState state) {
      final String loc = state.matchedLocation;

      // Enquanto o cofre não foi lido, **segura na tela de abertura**. Não dá
      // para mandar para a ativação (o terminal pode já estar pareado, e
      // piscaria em todo boot) nem deixar passar para a Home (é a tela
      // operacional, e apareceria antes de o app saber quem está no caixa).
      if (!ref.read(deviceCredentialHydratedProvider)) {
        return loc == PdvRoutes.starting ? null : PdvRoutes.starting;
      }

      final bool paired = ref.read(deviceCredentialProvider) != null;
      if (!paired) {
        return loc == PdvRoutes.activateTerminal
            ? null
            : PdvRoutes.activateTerminal;
      }
      // Terminal pareado não fica preso na ativação. O destino sai **aqui**,
      // numa passada só: quem acaba de ativar ainda não tem sessão → login;
      // quem já está logado e caiu na ativação (URL/manual) → Home. Mandar
      // sempre para a Home fazia o PDV abrir o Início sem login; mandar
      // sempre para o login e confiar no guard seguinte falhava quando o
      // refreshListenable aplicava um único salto.
      if (loc == PdvRoutes.activateTerminal) {
        final bool signedInLeavingActivate =
            ref.read(operatorSessionProvider) != null;
        return signedInLeavingActivate
            ? PdvRoutes.home
            : PdvRoutes.operatorLogin;
      }

      final bool signedIn = ref.read(operatorSessionProvider) != null;
      if (!signedIn) {
        return loc == PdvRoutes.operatorLogin ? null : PdvRoutes.operatorLogin;
      }
      if (loc == PdvRoutes.operatorLogin) {
        return PdvRoutes.home;
      }

      // Hidratado, pareado e com operador: a tela de abertura cumpriu o papel.
      // Fica **depois** dos outros guards de propósito — sem credencial ou sem
      // operador, quem tira daqui são eles, para a rota final ser a certa numa
      // passada só.
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
        name: 'home',
        builder: (BuildContext context, GoRouterState state) {
          // Raiz: não há para onde voltar.
          return const PdvScaffold(showBack: false, body: HomePage());
        },
      ),
      GoRoute(
        path: PdvRoutes.starting,
        name: 'starting',
        builder: (BuildContext context, GoRouterState state) {
          return const StartingPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.activateTerminal,
        name: 'activateTerminal',
        builder: (BuildContext context, GoRouterState state) {
          return const ActivateTerminalPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.operatorLogin,
        name: 'operatorLogin',
        builder: (BuildContext context, GoRouterState state) {
          return const OperatorLoginPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.counter,
        name: 'counter',
        builder: (BuildContext context, GoRouterState state) {
          return const CounterPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.payment,
        name: 'payment',
        builder: (BuildContext context, GoRouterState state) {
          return const PaymentPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.saleCompleted,
        name: 'saleCompleted',
        builder: (BuildContext context, GoRouterState state) {
          return const SaleCompletedPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.customerForm,
        name: 'customerForm',
        builder: (BuildContext context, GoRouterState state) {
          return const CustomerFormPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.cash,
        name: 'cash',
        builder: (BuildContext context, GoRouterState state) {
          final bool intentOpen = state.uri.queryParameters['intent'] == 'open';
          return CashHubPage(intentOpen: intentOpen);
        },
      ),
      GoRoute(
        path: PdvRoutes.cashMovement,
        name: 'cashMovement',
        builder: (BuildContext context, GoRouterState state) {
          return const CashMovementPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.cashClose,
        name: 'cashClose',
        builder: (BuildContext context, GoRouterState state) {
          return const CashClosePage();
        },
      ),
      GoRoute(
        path: PdvRoutes.salesHistory,
        name: 'salesHistory',
        builder: (BuildContext context, GoRouterState state) {
          return const SalesHistoryPage();
        },
        routes: <RouteBase>[
          GoRoute(
            path: ':saleId',
            name: 'saleDetail',
            builder: (BuildContext context, GoRouterState state) {
              final String saleId = state.pathParameters['saleId']!;
              return SaleDetailPage(saleId: saleId);
            },
          ),
        ],
      ),
      GoRoute(
        path: PdvRoutes.settings,
        name: 'settings',
        builder: (BuildContext context, GoRouterState state) {
          return const SettingsPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.tables,
        name: 'tables',
        builder: (BuildContext context, GoRouterState state) {
          return const TablesPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.tabs,
        name: 'tabs',
        builder: (BuildContext context, GoRouterState state) {
          return const TabsPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.service,
        name: 'service',
        builder: (BuildContext context, GoRouterState state) {
          return const ServiceQueuePage();
        },
      ),
      GoRoute(
        path: PdvRoutes.deliveryNew,
        name: 'deliveryNew',
        builder: (BuildContext context, GoRouterState state) {
          return const DeliveryNewPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.deliveryOrders,
        name: 'deliveryOrders',
        builder: (BuildContext context, GoRouterState state) {
          return const DeliveryOrdersPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.priceCheck,
        name: 'priceCheck',
        builder: (BuildContext context, GoRouterState state) {
          return const PriceCheckPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.refund,
        name: 'refund',
        builder: (BuildContext context, GoRouterState state) {
          return const RefundPage();
        },
      ),
      GoRoute(
        path: PdvRoutes.credit,
        name: 'credit',
        builder: (BuildContext context, GoRouterState state) {
          return const CreditPage();
        },
      ),
    ],
  );
}

/// Provider do router — recria quando o turno muda (guards).
final Provider<GoRouter> pdvRouterProvider = Provider<GoRouter>((Ref ref) {
  final ValueNotifier<int> refresh = ValueNotifier<int>(0);
  ref.onDispose(refresh.dispose);
  ref.listen(cashShiftProvider, (_, __) {
    refresh.value++;
  });
  ref.listen(salonProvider, (_, __) {
    refresh.value++;
  });
  // Parear e revogar mudam a rota permitida — sem isto o redirect só
  // reavaliaria na próxima navegação manual.
  ref.listen(deviceCredentialProvider, (_, __) {
    refresh.value++;
  });
  ref.listen(deviceCredentialHydratedProvider, (_, __) {
    refresh.value++;
  });
  ref.listen(operatorSessionProvider, (_, __) {
    refresh.value++;
  });
  final GoRouter router = createPdvRouter(ref, refresh);
  ref.onDispose(router.dispose);
  return router;
});

/// Nome da tela para a barra de título, **derivado da rota**.
///
/// Função pura de propósito: enquanto o título era atribuído à mão antes de
/// cada `push`, ninguém o devolvia no `pop` — a barra continuava anunciando
/// "Mesas" depois de voltar para o Início. Derivando da rota, o título não
/// tem como ficar velho, e tela nova só precisa entrar neste `switch`.
String pdvPageTitleForLocation(String location) {
  final String path = Uri.tryParse(location)?.path ?? location;
  final String title = switch (path) {
    PdvRoutes.home => 'Início',
    PdvRoutes.counter => 'Balcão',
    PdvRoutes.payment => 'Pagamento',
    PdvRoutes.saleCompleted => 'Venda finalizada',
    PdvRoutes.customerForm => 'Cliente',
    PdvRoutes.cash => 'Caixa',
    PdvRoutes.cashMovement => 'Sangria / reforço',
    PdvRoutes.cashClose => 'Fechamento de caixa',
    PdvRoutes.salesHistory => 'Últimas vendas',
    PdvRoutes.settings => 'Configurações',
    PdvRoutes.tables => 'Mesas',
    PdvRoutes.tabs => 'Comandas',
    PdvRoutes.service => 'Atendimentos',
    PdvRoutes.deliveryNew => 'Delivery',
    PdvRoutes.deliveryOrders => 'Delivery',
    PdvRoutes.priceCheck => 'Consulta de preço',
    PdvRoutes.refund => 'Devolução',
    PdvRoutes.credit => 'Crédito dos clientes',
    PdvRoutes.starting => 'Abrindo…',
    PdvRoutes.activateTerminal => 'Ativar terminal',
    PdvRoutes.operatorLogin => 'Entrar',
    _ when path.startsWith('${PdvRoutes.salesHistory}/') => 'Venda',
    _ => 'Citybox PDV',
  };
  return title;
}
