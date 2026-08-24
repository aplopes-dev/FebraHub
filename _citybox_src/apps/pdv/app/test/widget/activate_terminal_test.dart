import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/home/presentation/home_page.dart';
import 'package:citybox_pdv/features/operators/presentation/operator_login_page.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/presentation/activate_terminal_page.dart';

import '../helpers/fake_device_credential_store.dart';
import '../helpers/pump_with_router.dart';

/// Terminal sem credencial não opera.
///
/// É o gate que transforma "um app instalado em qualquer lugar" em "o Caixa 2
/// da Loja Centro". Sem ele, bastaria ter o app e uma credencial de
/// funcionário para vender em nome da loja de onde quer que fosse.

/// Resposta de sucesso do `redeem`, no formato real da API.
(int, Map<String, Object?>) _pairedResponse(RequestOptions _) => (
  201,
  <String, Object?>{
    'data': <String, Object?>{
      'deviceToken': 'token-novo-em-folha',
      'terminal': <String, Object?>{
        'id': 'terminal-9',
        'name': 'Caixa 9',
        'organizationId': 'org-1',
        'branchId': 'branch-1',
      },
    },
  },
);

/// Erro de domínio da API, no formato `{ error: { code, message } }`.
(int, Map<String, Object?>) _invalidCodeResponse(RequestOptions _) => (
  422,
  <String, Object?>{
    'error': <String, Object?>{
      'code': 'PosTerminalPairingCodeInvalidError',
      'message': 'Código de pareamento inválido ou expirado',
    },
  },
);

({PdvApiClient client, FakeHttpAdapter adapter}) _fakeClient(
  (int, Map<String, Object?>) Function(RequestOptions) responder,
) {
  final PdvApiClient client = PdvApiClient(baseUrl: 'http://fake.local/api');
  final FakeHttpAdapter adapter = FakeHttpAdapter(responder);
  client.dio.httpClientAdapter = adapter;
  // `validateStatus` fica no padrão de propósito: é o Dio lançar em 4xx que
  // dispara a tradução em `PdvApiException.from`. Forçá-lo a aceitar tudo
  // testaria um caminho que o app não tem.
  return (client: client, adapter: adapter);
}

void main() {
  testWidgets('sem credencial, qualquer rota cai na ativação', (
    WidgetTester tester,
  ) async {
    for (final String route in <String>[
      PdvRoutes.home,
      PdvRoutes.settings,
      PdvRoutes.cash,
    ]) {
      await pumpWithRouter(
        tester,
        initialLocation: route,
        withPairedTerminal: false,
        withOpenShift: false,
      );
      await tester.pumpAndSettle();

      expect(
        find.byType(ActivateTerminalPage),
        findsOneWidget,
        reason: '$route deixou passar sem terminal pareado',
      );
    }
  });

  testWidgets('com credencial, a ativação não fica no caminho', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      initialLocation: PdvRoutes.activateTerminal,
      withPairedTerminal: true,
    );
    await tester.pumpAndSettle();

    // Terminal já pareado que tenta abrir a ativação sai dela — do contrário
    // ficaria preso numa tela sem saída (ela não tem Voltar). Com operador
    // logado (padrão do harness) o destino final é a Home.
    expect(find.byType(ActivateTerminalPage), findsNothing);
    expect(find.byType(HomePage), findsOneWidget);
  });

  testWidgets(
    'pareado sem operador: ativação cai no login, não no Início',
    (WidgetTester tester) async {
      await pumpWithRouter(
        tester,
        initialLocation: PdvRoutes.activateTerminal,
        withPairedTerminal: true,
        withOperator: false,
        withOpenShift: false,
      );
      await tester.pumpAndSettle();

      // ⚠️ A trava do bug reportado: após ativar (ou reabrir a ativação com
      // terminal já pareado e sem sessão), o PDV ia para o Início e só
      // redirecionava ao Entrar no próximo clique.
      expect(find.byType(ActivateTerminalPage), findsNothing);
      expect(find.byType(HomePage), findsNothing);
      expect(find.byType(OperatorLoginPage), findsOneWidget);
    },
  );

  testWidgets('a tela pede o código e mostra como o dispositivo se apresenta', (
    WidgetTester tester,
  ) async {
    await pumpWithRouter(
      tester,
      withPairedTerminal: false,
      withOpenShift: false,
    );
    await tester.pumpAndSettle();

    expect(find.text('Ativar terminal'), findsWidgets);
    expect(find.text('Código de ativação'), findsOneWidget);
    expect(find.text('ATIVAR'), findsOneWidget);
    // Sem Voltar de propósito: não há para onde voltar antes de o terminal
    // existir.
    expect(find.text('VOLTAR'), findsNothing);
  });

  testWidgets('código válido parea, grava no cofre e leva ao login', (
    WidgetTester tester,
  ) async {
    final FakeDeviceCredentialStore store = FakeDeviceCredentialStore();
    final ({PdvApiClient client, FakeHttpAdapter adapter}) fake = _fakeClient(
      _pairedResponse,
    );

    final ProviderContainer container = await pumpWithRouter(
      tester,
      withPairedTerminal: false,
      withOpenShift: false,
      withOperator: false,
      credentialStore: store,
      overrides: <Override>[
        pdvApiClientProvider.overrideWithValue(fake.client),
      ],
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'abcd2345');
    await tester.tap(find.text('ATIVAR'));
    await tester.pumpAndSettle();

    // O código sobe em maiúsculas: o servidor compara literal, e o operador
    // digita como vier.
    final Object? body = fake.adapter.lastRequest?.data;
    expect(body, isA<Map<String, Object?>>());
    expect((body! as Map<String, Object?>)['code'], 'ABCD2345');

    expect(store.writes, 1);
    expect(container.read(deviceCredentialProvider)?.terminalName, 'Caixa 9');
    expect(find.byType(ActivateTerminalPage), findsNothing);
    // Depois de ativar ainda não há sessão — a primeira tela operacional é
    // Entrar, nunca o Início.
    expect(find.byType(OperatorLoginPage), findsOneWidget);
    expect(find.byType(HomePage), findsNothing);
  });

  testWidgets('código recusado mostra a mensagem da API e não parea', (
    WidgetTester tester,
  ) async {
    final FakeDeviceCredentialStore store = FakeDeviceCredentialStore();
    final ({PdvApiClient client, FakeHttpAdapter adapter}) fake = _fakeClient(
      _invalidCodeResponse,
    );

    final ProviderContainer container = await pumpWithRouter(
      tester,
      withPairedTerminal: false,
      withOpenShift: false,
      credentialStore: store,
      overrides: <Override>[
        pdvApiClientProvider.overrideWithValue(fake.client),
      ],
    );
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'ZZZZ9999');
    await tester.tap(find.text('ATIVAR'));
    await tester.pumpAndSettle();

    expect(
      find.text('Código de pareamento inválido ou expirado'),
      findsOneWidget,
    );
    expect(store.writes, 0);
    expect(container.read(deviceCredentialProvider), isNull);
    expect(find.byType(ActivateTerminalPage), findsOneWidget);
  });

  testWidgets('esquecer a credencial devolve o terminal para a ativação', (
    WidgetTester tester,
  ) async {
    final FakeDeviceCredentialStore store = FakeDeviceCredentialStore(
      pairedFixture,
    );
    final ProviderContainer container = await pumpWithRouter(
      tester,
      credentialStore: store,
    );
    await tester.pumpAndSettle();
    expect(find.byType(ActivateTerminalPage), findsNothing);

    await container.read(deviceCredentialProvider.notifier).forget();
    await tester.pumpAndSettle();

    // O redirect reage ao provider — nenhuma tela precisa navegar à mão.
    expect(find.byType(ActivateTerminalPage), findsOneWidget);
  });
}
