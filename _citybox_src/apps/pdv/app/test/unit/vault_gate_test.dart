import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/storage/secure_store_failure.dart';

void main() {
  setUp(debugResetVaultGate);

  test('runInVault serializa operações concorrentes', () async {
    final List<String> log = <String>[];

    Future<void> step(String id) => runInVault(() async {
      log.add('start-$id');
      await Future<void>.delayed(const Duration(milliseconds: 20));
      log.add('end-$id');
    });

    await Future.wait<void>(<Future<void>>[
      step('a'),
      step('b'),
      step('c'),
    ]);

    // Sem a fila, o log intercalaria start-a/start-b/...; com ela, cada
    // operação fecha antes da próxima abrir — o bug do Linux era exatamente
    // dois write lerem o mesmo JSON e o segundo apagar a credencial.
    expect(log, <String>[
      'start-a',
      'end-a',
      'start-b',
      'end-b',
      'start-c',
      'end-c',
    ]);
  });

  test('falha numa operação não trava a fila', () async {
    await expectLater(
      runInVault<void>(() async {
        throw StateError('boom');
      }),
      throwsA(isA<StateError>()),
    );

    expect(await runInVault(() async => 7), 7);
  });
}
