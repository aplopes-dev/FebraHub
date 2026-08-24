import '../helpers/fake_pos_cash_session_api.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/data/pos_cash_session_api.dart';
import 'package:citybox_pdv/features/cash/data/shared_preferences_cash_shift_store.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/sale_record.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';

/// Toda venda, sangria e turno tem que dizer **quem** operou.
///
/// Existe porque não dizia: `CashShift`, `SaleRecord` e `CashMovement` não
/// guardavam operador nenhum, e histórico gravado assim é anônimo para sempre —
/// não há migração que descubra depois quem cancelou a venda ou tirou o
/// dinheiro da gaveta.

const PosOperator _ana = PosOperator(id: 'op-a', code: '10', name: 'Ana');

SaleRecord _sale({String id = 'sale-1'}) {
  return SaleRecord(
    id: id,
    shiftId: 'shift',
    status: SaleRecordStatus.completed,
    createdAt: DateTime(2026, 8, 6, 10),
    lines: const <SaleLineSnapshot>[],
    payments: const <SalePaymentSnapshot>[],
    subtotalCents: 1000,
    totalCents: 1000,
    cashReceivedCents: 1000,
    changeCents: 0,
    cashNetCents: 1000,
  );
}

void main() {
  late ProviderContainer container;

  setUp(() async {
    SharedPreferences.setMockInitialValues(<String, Object>{});
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    container = ProviderContainer(
      overrides: <Override>[
        cashShiftStoreProvider.overrideWithValue(
          SharedPreferencesCashShiftStore(prefs),
        ),
        posCashSessionApiProvider.overrideWithValue(FakePosCashSessionApi()),
      ],
    );
    await container.read(cashShiftProvider.notifier).hydrate();
  });

  tearDown(() => container.dispose());

  CashShiftController controller() =>
      container.read(cashShiftProvider.notifier);

  group('carimbo de operador', () {
    test('o turno guarda quem o abriu, por id e por nome', () async {
      await controller().openShift(openingFloatCents: 5000, operator: _ana);

      final CashShift? shift = container.read(cashShiftProvider);
      expect(shift?.openedByOperatorId, _ana.id);
      // Nome por cópia: o histórico continua legível depois de o funcionário
      // sair do cadastro.
      expect(shift?.openedByOperatorName, _ana.name);
    });

    test(
      'a venda sai com o operador do turno quando a record não traz nenhum',
      () async {
        await controller().openShift(openingFloatCents: 0, operator: _ana);
        await controller().recordSale(_sale());

        final SaleRecord recorded =
            container.read(cashShiftProvider)!.sales.single;
        expect(recorded.operatorId, _ana.id);
        expect(recorded.operatorName, _ana.name);
      },
    );

    test(
      'a venda preserva o operador passado (logado ≠ quem abriu o turno)',
      () async {
        const PosOperator bruno = PosOperator(
          id: 'op-b',
          code: '20',
          name: 'Bruno',
        );
        await controller().openShift(openingFloatCents: 0, operator: _ana);
        await controller().recordSale(
          SaleRecord(
            id: 'sale-op2',
            shiftId: 'shift',
            status: SaleRecordStatus.completed,
            createdAt: DateTime(2026, 8, 6, 11),
            lines: const <SaleLineSnapshot>[],
            payments: const <SalePaymentSnapshot>[],
            subtotalCents: 1000,
            totalCents: 1000,
            cashReceivedCents: 1000,
            changeCents: 0,
            cashNetCents: 1000,
            operatorId: bruno.id,
            operatorName: bruno.name,
          ),
        );

        final SaleRecord recorded =
            container.read(cashShiftProvider)!.sales.single;
        expect(recorded.operatorId, bruno.id);
        expect(recorded.operatorName, bruno.name);
      },
    );

    test('sangria e reforço saem com o operador do turno', () async {
      await controller().openShift(openingFloatCents: 20000, operator: _ana);
      await controller().addWithdrawal(amountCents: 500, reason: 'troco');
      await controller().addReinforcement(amountCents: 300, reason: 'fundo');

      final List<CashMovement> movements =
          container.read(cashShiftProvider)!.movements;
      expect(movements, hasLength(2));
      for (final CashMovement movement in movements) {
        expect(movement.operatorId, _ana.id);
        expect(movement.operatorName, _ana.name);
      }
    });

    test('o nome é snapshot, não referência ao cadastro', () async {
      await controller().openShift(openingFloatCents: 0, operator: _ana);
      await controller().recordSale(_sale());

      // O registro guarda o nome por cópia. Quando o operador for desligado e
      // sumir de `GET /v1/pos/operators`, esta linha continua nomeando quem
      // vendeu — que é a única coisa que a auditoria pode consultar depois.
      expect(
        container.read(cashShiftProvider)!.sales.single.operatorName,
        _ana.name,
      );
    });

    test('operador e vendedor são campos distintos', () async {
      await controller().openShift(openingFloatCents: 0, operator: _ana);
      await controller().recordSale(_sale());

      final SaleRecord recorded =
          container.read(cashShiftProvider)!.sales.single;
      expect(recorded.operatorId, _ana.id);
      // Venda sem vendedor escolhido continua sem vendedor — o operador não
      // preenche essa lacuna, são perguntas diferentes.
      expect(recorded.sellerId, isNull);
    });
  });

  group('retrocompatibilidade', () {
    test('turno gravado antes do operador continua abrindo', () {
      final Map<String, Object?> json =
          CashShift(
              id: 'old',
              status: CashShiftStatus.open,
              openedAt: DateTime(2026, 8, 1),
              openingFloatCents: 10000,
              movements: const <CashMovement>[],
              sales: const <SaleRecord>[],
            ).toJson()
            ..remove('openedByOperatorId')
            ..remove('openedByOperatorName');

      final CashShift restored = CashShift.fromJson(
        Map<String, dynamic>.from(json),
      );
      expect(restored.openedByOperatorId, isNull);
      expect(restored.openedByOperatorName, isNull);
      expect(restored.isOpen, isTrue);
    });

    test('venda gravada antes do operador continua abrindo', () {
      final Map<String, Object?> json =
          _sale().toJson()
            ..remove('operatorId')
            ..remove('operatorName');

      final SaleRecord restored = SaleRecord.fromJson(
        Map<String, dynamic>.from(json),
      );
      expect(restored.operatorId, isNull);
      expect(restored.operatorName, isNull);
    });

    test('movimento gravado antes do operador continua abrindo', () {
      final Map<String, Object?> json =
          CashMovement(
              id: 'm1',
              type: CashMovementType.withdrawal,
              amountCents: 100,
              reason: 'x',
              createdAt: DateTime(2026, 8, 1),
              shiftId: 'shift',
            ).toJson()
            ..remove('operatorId')
            ..remove('operatorName');

      final CashMovement restored = CashMovement.fromJson(
        Map<String, dynamic>.from(json),
      );
      expect(restored.operatorId, isNull);
      expect(restored.operatorName, isNull);
    });

    test('operador sobrevive ao round-trip de JSON', () async {
      await controller().openShift(openingFloatCents: 0, operator: _ana);
      await controller().recordSale(_sale());

      final CashShift original = container.read(cashShiftProvider)!;
      final CashShift restored = CashShift.fromJson(
        Map<String, dynamic>.from(original.toJson()),
      );
      expect(restored.openedByOperatorName, _ana.name);
      expect(restored.sales.single.operatorName, _ana.name);
    });
  });
}
