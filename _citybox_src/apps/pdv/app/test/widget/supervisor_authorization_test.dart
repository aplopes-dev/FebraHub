import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/application/supervisor_authorization.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/operators/presentation/supervisor_authorization_dialog.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';

import '../helpers/operator_fixture.dart';

void main() {
  group('SupervisorAuthorizer', () {
    test('supervisor autoriza e volta com id e nome', () async {
      final SupervisorAuthorizer authorizer = SupervisorAuthorizer(
        FakePosOperatorApi(),
      );

      final SupervisorAuthorization authorization = await authorizer.authorize(
        code: testSupervisor.code,
        pin: '1234',
      );

      expect(authorization.operatorId, testSupervisor.id);
      expect(authorization.operatorName, testSupervisor.name);
    });

    test('operador comum é recusado com mensagem própria', () async {
      final SupervisorAuthorizer authorizer = SupervisorAuthorizer(
        FakePosOperatorApi(),
      );

      // PIN certo, pessoa errada. A mensagem tem que dizer que o problema é a
      // pessoa — senão o operador fica repetindo dígitos que estão corretos e
      // gasta as tentativas do bloqueio.
      await expectLater(
        authorizer.authorize(code: testOperator.code, pin: '1234'),
        throwsA(
          isA<PdvApiException>().having(
            (PdvApiException e) => e.message,
            'message',
            SupervisorAuthorizer.notAuthorizedMessage,
          ),
        ),
      );
    });

    test('authorizeWithPermission exige a permissão pedida', () async {
      final SupervisorAuthorizer authorizer = SupervisorAuthorizer(
        FakePosOperatorApi(
          operators: const <PosOperator>[testCashier, testSupervisor],
        ),
      );

      await expectLater(
        authorizer.authorizeWithPermission(
          code: testCashier.code,
          pin: '1234',
          requiredPermissionId: PosOperator.withdrawalPermission,
        ),
        throwsA(
          isA<PdvApiException>().having(
            (PdvApiException e) => e.message,
            'message',
            SupervisorAuthorizer.notAuthorizedMessage,
          ),
        ),
      );

      final SupervisorAuthorization ok = await authorizer.authorizeWithPermission(
        code: testSupervisor.code,
        pin: '1234',
        requiredPermissionId: PosOperator.withdrawalPermission,
      );
      expect(ok.operatorId, testSupervisor.id);
    });

    test('PIN errado sobe o erro da API, não o de papel', () async {
      final SupervisorAuthorizer authorizer = SupervisorAuthorizer(
        FakePosOperatorApi(),
      );

      await expectLater(
        authorizer.authorize(code: testSupervisor.code, pin: '9999'),
        throwsA(
          isA<PdvApiException>().having(
            (PdvApiException e) => e.statusCode,
            'statusCode',
            401,
          ),
        ),
      );
    });
  });

  group('requestSupervisorAuthorization', () {
    late FakePosOperatorApi api;
    late ProviderContainer container;
    SupervisorAuthorization? result;

    Future<void> pumpDialog(WidgetTester tester) async {
      api = FakePosOperatorApi();
      result = null;

      await tester.pumpWidget(
        ProviderScope(
          overrides: <Override>[
            posOperatorApiProvider.overrideWithValue(api),
            operatorCacheStoreProvider.overrideWithValue(
              FakeOperatorCacheStore(),
            ),
          ],
          child: Consumer(
            builder: (BuildContext context, WidgetRef ref, _) {
              container = ProviderScope.containerOf(context);
              return MaterialApp(
                home: Scaffold(
                  body: Builder(
                    builder:
                        (BuildContext context) => TextButton(
                          onPressed: () async {
                            result = await requestSupervisorAuthorization(
                              context,
                              operation: PosOperation.withdrawal,
                              detail: 'Sangria de R\$ 800,00',
                            );
                          },
                          child: const Text('abrir'),
                        ),
                  ),
                ),
              );
            },
          ),
        ),
      );

      // Sessão do caixa começa com o operador comum — é ela que não pode mudar.
      await container
          .read(operatorSessionProvider.notifier)
          .signIn(code: testOperator.code, pin: api.acceptedPin);

      await tester.tap(find.text('abrir'));
      await tester.pumpAndSettle();
    }

    testWidgets('mostra o que está sendo autorizado', (
      WidgetTester tester,
    ) async {
      await pumpDialog(tester);

      expect(find.textContaining('Sangria'), findsWidgets);
      expect(find.text('Sangria de R\$ 800,00'), findsOneWidget);
    });

    testWidgets('só oferece supervisores na lista', (
      WidgetTester tester,
    ) async {
      await pumpDialog(tester);

      await tester.tap(find.byType(DropdownButtonFormField<PosOperator>));
      await tester.pumpAndSettle();

      expect(find.text(testSupervisor.label), findsWidgets);
      expect(find.text(testOperator.label), findsNothing);
    });

    testWidgets('autorizar não troca a sessão do caixa', (
      WidgetTester tester,
    ) async {
      await pumpDialog(tester);

      await tester.tap(find.byType(DropdownButtonFormField<PosOperator>));
      await tester.pumpAndSettle();
      await tester.tap(find.text(testSupervisor.label).last);
      await tester.pumpAndSettle();

      for (final String digit in <String>['1', '2', '3', '4']) {
        await tester.tap(find.text(digit));
        await tester.pump();
      }
      await tester.pumpAndSettle();

      expect(result?.operatorName, testSupervisor.name);
      // O ponto do teste: a venda seguinte continua sendo do operador logado.
      expect(container.read(operatorSessionProvider)?.id, testOperator.id);
    });

    testWidgets('cancelar devolve nulo', (WidgetTester tester) async {
      await pumpDialog(tester);

      await tester.tap(find.text('Cancelar'));
      await tester.pumpAndSettle();

      expect(result, isNull);
      expect(container.read(operatorSessionProvider)?.id, testOperator.id);
    });
  });
}
