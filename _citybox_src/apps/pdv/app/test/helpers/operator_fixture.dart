import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/features/operators/data/pos_operator_api.dart';
import 'package:citybox_pdv/features/operators/data/secure_operator_cache_store.dart';
import 'package:citybox_pdv/features/operators/domain/operator_cache.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';

/// Operador padrão dos testes — pode sangrar (como Gerente/Admin); alçada
/// ainda se aplica. Para perfil Caixa sem sangria, use [testCashier].
const PosOperator testOperator = PosOperator(
  id: 'op-teste',
  code: '01',
  name: 'Operador de Teste',
  permissionIds: const <String>[
    'pdv.operacao.venda.create',
    PosOperator.withdrawalPermission,
  ],
);

/// Sem sangria nem alçada — espelha perfil Caixa.
const PosOperator testCashier = PosOperator(
  id: 'op-caixa',
  code: '02',
  name: 'Caixa de Teste',
  permissionIds: const <String>[
    'pdv.operacao.caixa.open',
    'pdv.operacao.venda.create',
  ],
);

const PosOperator testSupervisor = PosOperator(
  id: 'op-supervisor',
  code: '99',
  name: 'Supervisora de Teste',
  permissionIds: const <String>[
    PosOperator.alcadaAuthorizePermission,
    PosOperator.withdrawalPermission,
  ],
);

/// API de operadores sem rede.
///
/// Implementa a interface real para o teste exercitar o mesmo caminho do app —
/// inclusive o tratamento de erro, que é onde mora o comportamento de
/// bloqueio.
class FakePosOperatorApi implements PosOperatorApi {
  FakePosOperatorApi({
    this.operators = const <PosOperator>[testOperator, testSupervisor],
    this.acceptedPin = '1234',
  });

  final List<PosOperator> operators;

  /// PIN que a "API" aceita. Qualquer outro devolve o erro genérico.
  final String acceptedPin;

  /// Erro forçado — usado para testar bloqueio (423) e falha de rede.
  PdvApiException? failure;

  int authenticateCalls = 0;
  int syncCalls = 0;

  /// Pacote devolvido por [sync]. `null` = a "API" recusa sincronizar.
  OperatorCache? syncPackage;

  /// A listagem só falha quando o erro forçado é **de rede**.
  ///
  /// Um 423 em `authenticate` significa "este operador está bloqueado", não
  /// "a API caiu" — fazer a lista falhar junto inventaria um cenário que não
  /// existe, e escondia a tela de login do teste de bloqueio.
  @override
  Future<List<PosOperator>> list() async {
    final PdvApiException? forced = failure;
    if (forced != null && forced.isOffline) throw forced;
    return operators;
  }

  @override
  Future<OperatorCache> sync() async {
    syncCalls++;
    final PdvApiException? forced = failure;
    if (forced != null) throw forced;
    final OperatorCache? package = syncPackage;
    if (package == null) {
      throw const PdvApiException('Sem pacote de sincronização.');
    }
    return package;
  }

  @override
  Future<PosOperator> authenticate({
    required String code,
    required String pin,
  }) async {
    authenticateCalls++;
    final PdvApiException? forced = failure;
    if (forced != null) throw forced;

    final PosOperator? match = operators.cast<PosOperator?>().firstWhere(
      (PosOperator? o) => o?.code == code,
      orElse: () => null,
    );
    if (match == null || pin != acceptedPin) {
      // Mesma resposta para código inexistente e PIN errado — é o contrato da
      // API real, e o teste tem que exercitar esse contrato.
      throw const PdvApiException('Código ou PIN incorreto', statusCode: 401);
    }
    return match;
  }
}

/// Hash **gerado pela `erp-api`** para o PIN `1234` (ver
/// `test/unit/pdv_pin_hasher_test.dart`). O caminho offline confere contra ele,
/// então o teste exercita a criptografia de verdade, não um stub.
const String testPinHash =
    r'scrypt$65536$8$1$Z8eoOqS1F75CXJDKk0iKYw==$'
    r'J7DjLUcgqNwW9l5ExRDNvKCunAo2i1guuhdXu6KUkZg=';

/// Pacote de sincronização com os dois operadores de teste.
OperatorCache operatorCacheFixture({
  required DateTime syncedAt,
  required DateTime expiresAt,
  List<PosOperator> operators = const <PosOperator>[
    testOperator,
    testSupervisor,
  ],
}) {
  return OperatorCache(
    operators:
        operators
            .map(
              (PosOperator o) =>
                  CachedOperator(operator: o, pinHash: testPinHash),
            )
            .toList(),
    syncedAt: syncedAt,
    expiresAt: expiresAt,
  );
}

/// Cofre em memória do cache offline.
class FakeOperatorCacheStore implements OperatorCacheStore {
  FakeOperatorCacheStore([this._cache]);

  OperatorCache? _cache;
  Map<String, int> _attempts = <String, int>{};

  int writes = 0;

  @override
  Future<OperatorCache?> read() async => _cache;

  @override
  Future<void> write(OperatorCache cache) async {
    writes++;
    _cache = cache;
  }

  @override
  Future<void> clear() async => _cache = null;

  @override
  Future<Map<String, int>> readAttempts() async => _attempts;

  @override
  Future<void> writeAttempts(Map<String, int> attempts) async =>
      _attempts = attempts;
}
