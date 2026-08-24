import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/features/operators/domain/operator_cache.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';

final DateTime now = DateTime.utc(2026, 8, 6, 12);

OperatorCache cacheExpiringAt(DateTime expiresAt) {
  return OperatorCache(
    operators: const <CachedOperator>[
      CachedOperator(
        operator: PosOperator(id: 'op-1', code: '01', name: 'Maria'),
        pinHash: r'scrypt$65536$8$1$c2FsdA==$aGFzaA==',
      ),
    ],
    syncedAt: expiresAt.subtract(const Duration(hours: 48)),
    expiresAt: expiresAt,
  );
}

void main() {
  group('Validade', () {
    test('vencido no instante exato', () {
      // `!now.isBefore(expiresAt)` e não `isAfter`: no milissegundo do
      // vencimento o cache já não vale. A janela de um milissegundo não muda
      // nada na prática, mas ambiguidade em regra de validade sempre vira
      // discussão depois.
      expect(cacheExpiringAt(now).isExpired(now), isTrue);
    });

    test('válido um instante antes', () {
      expect(
        cacheExpiringAt(now.add(const Duration(seconds: 1))).isExpired(now),
        isFalse,
      );
    });

    test('avisa quando falta menos de um dia', () {
      expect(
        cacheExpiringAt(now.add(const Duration(hours: 23))).isExpiringSoon(now),
        isTrue,
      );
      expect(
        cacheExpiringAt(now.add(const Duration(hours: 25))).isExpiringSoon(now),
        isFalse,
      );
    });

    test('vencido não é "vencendo"', () {
      // Estados excludentes: o vencido já tem aviso próprio, mais grave.
      final OperatorCache expired = cacheExpiringAt(
        now.subtract(const Duration(hours: 1)),
      );
      expect(expired.isExpired(now), isTrue);
      expect(expired.isExpiringSoon(now), isFalse);
    });
  });

  group('AC-M4-9 — pacote inválido é tratado como ausente', () {
    test('sobrevive a ida e volta', () {
      final OperatorCache original = cacheExpiringAt(
        now.add(const Duration(hours: 47)),
      );

      final OperatorCache? roundTrip = OperatorCache.fromJson(
        original.toJson(),
      );

      expect(roundTrip, isNotNull);
      expect(roundTrip!.operators.single.operator.code, '01');
      expect(roundTrip.operators.single.pinHash, isNotEmpty);
      expect(roundTrip.expiresAt, original.expiresAt);
    });

    test('pacote sem validade é descartado', () {
      // ⚠️ Rígido de propósito, ao contrário do resto do app: sem `expiresAt`
      // o terminal entraria sem saber até quando pode. Melhor exigir rede.
      expect(
        OperatorCache.fromJson(<String, dynamic>{
          'operators': <dynamic>[],
          'syncedAt': now.toIso8601String(),
        }),
        isNull,
      );
    });

    test('pacote sem lista de operadores é descartado', () {
      expect(
        OperatorCache.fromJson(<String, dynamic>{
          'syncedAt': now.toIso8601String(),
          'expiresAt': now.toIso8601String(),
        }),
        isNull,
      );
    });

    test('operador sem hash derruba o pacote inteiro', () {
      // Não é "ignora esse e segue": um pacote parcialmente lido faria o
      // operador faltante ser recusado como se o PIN estivesse errado.
      expect(
        OperatorCache.fromJson(<String, dynamic>{
          'operators': <dynamic>[
            <String, dynamic>{'id': 'op-1', 'code': '01', 'name': 'Maria'},
          ],
          'syncedAt': now.toIso8601String(),
          'expiresAt': now.toIso8601String(),
        }),
        isNull,
      );
    });

    test('data ilegível é descartada', () {
      expect(
        OperatorCache.fromJson(<String, dynamic>{
          'operators': <dynamic>[],
          'syncedAt': 'ontem',
          'expiresAt': 'amanhã',
        }),
        isNull,
      );
    });
  });

  group('Busca por código', () {
    test('encontra ignorando espaços', () {
      final OperatorCache cache = cacheExpiringAt(now);
      expect(cache.findByCode(' 01 ')?.operator.name, 'Maria');
    });

    test('código inexistente devolve nulo', () {
      expect(cacheExpiringAt(now).findByCode('99'), isNull);
    });
  });

  group('permissionIds (Membership)', () {
    test('persiste permissionIds e membershipId na ida e volta', () {
      final OperatorCache original = OperatorCache(
        operators: const <CachedOperator>[
          CachedOperator(
            operator: PosOperator(
              id: 'user-1',
              membershipId: 'mem-1',
              code: '01',
              name: 'Maria',
              permissionIds: const <String>[
                'pdv.operacao.venda.create',
                PosOperator.alcadaAuthorizePermission,
              ],
            ),
            pinHash: r'scrypt$65536$8$1$c2FsdA==$aGFzaA==',
          ),
        ],
        syncedAt: now,
        expiresAt: now.add(const Duration(hours: 48)),
      );

      final OperatorCache? roundTrip = OperatorCache.fromJson(
        original.toJson(),
      );
      final PosOperator op = roundTrip!.operators.single.operator;

      expect(op.membershipId, 'mem-1');
      expect(op.permissionIds, contains(PosOperator.alcadaAuthorizePermission));
      expect(op.isSupervisor, isTrue);
      expect(original.toJson()['operators'], isA<List<dynamic>>());
      final Map<String, Object?> first =
          (original.toJson()['operators']! as List<dynamic>).single
              as Map<String, Object?>;
      expect(first.containsKey('role'), isFalse);
      expect(first['permissionIds'], isA<List<dynamic>>());
    });

    test('cache legado com role=supervisor vira permissão de alçada', () {
      final OperatorCache? legacy = OperatorCache.fromJson(<String, dynamic>{
        'operators': <dynamic>[
          <String, dynamic>{
            'id': 'op-1',
            'code': '99',
            'name': 'Gerente',
            'role': 'supervisor',
            'pinHash': r'scrypt$65536$8$1$c2FsdA==$aGFzaA==',
          },
        ],
        'syncedAt': now.toIso8601String(),
        'expiresAt': now.add(const Duration(hours: 48)).toIso8601String(),
      });

      expect(legacy, isNotNull);
      expect(legacy!.operators.single.operator.isSupervisor, isTrue);
      expect(
        legacy.operators.single.operator.permissionIds,
        <String>[PosOperator.alcadaAuthorizePermission],
      );
    });

    test('sem permissionIds e sem role legado não é supervisor', () {
      final PosOperator op = PosOperator.fromJson(<String, dynamic>{
        'id': 'op-1',
        'code': '01',
        'name': 'Maria',
      });
      expect(op.permissionIds, isEmpty);
      expect(op.isSupervisor, isFalse);
    });
  });
}
