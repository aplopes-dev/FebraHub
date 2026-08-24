import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/payment/application/sale_seller_controller.dart';
import 'package:citybox_pdv/features/payment/application/terminal_sellers_controller.dart';
import 'package:citybox_pdv/features/payment/domain/seller.dart';

import '../helpers/operator_fixture.dart';

void main() {
  const Seller matchingSeller = Seller(
    id: 'op-teste',
    code: '01',
    name: 'Operador de Teste',
  );
  const Seller otherSeller = Seller(
    id: 'other',
    code: '99',
    name: 'Outro Vendedor',
  );

  ProviderContainer buildContainer({
    required List<Seller> sellers,
    required PosOperator operator,
  }) {
    return ProviderContainer(
      overrides: <Override>[
        terminalSellersProvider.overrideWith(
          (Ref ref) async => sellers,
        ),
        operatorSessionProvider.overrideWith(
          () => _FixedSession(operator),
        ),
      ],
    );
  }

  test('ensureDefaultSeller seleciona o operador logado quando ele é vendedor',
      () async {
    final ProviderContainer container = buildContainer(
      sellers: const <Seller>[matchingSeller, otherSeller],
      operator: testOperator,
    );
    addTearDown(container.dispose);

    container.read(saleSellerProvider);
    await container.read(terminalSellersProvider.future);
    container.read(saleSellerProvider.notifier).ensureDefaultSeller();
    expect(container.read(saleSellerProvider)?.id, matchingSeller.id);
  });

  test('clear explícito não reaplica o default na mesma venda', () async {
    final ProviderContainer container = buildContainer(
      sellers: const <Seller>[matchingSeller],
      operator: testOperator,
    );
    addTearDown(container.dispose);

    container.read(saleSellerProvider);
    await container.read(terminalSellersProvider.future);
    container.read(saleSellerProvider.notifier).ensureDefaultSeller();
    expect(container.read(saleSellerProvider), isNotNull);
    container.read(saleSellerProvider.notifier).clear();
    container.read(saleSellerProvider.notifier).ensureDefaultSeller();
    expect(container.read(saleSellerProvider), isNull);
  });

  test('prepareForNewSale reaplica o default', () async {
    final ProviderContainer container = buildContainer(
      sellers: const <Seller>[matchingSeller],
      operator: testOperator,
    );
    addTearDown(container.dispose);

    container.read(saleSellerProvider);
    await container.read(terminalSellersProvider.future);
    container.read(saleSellerProvider.notifier).clear();
    container.read(saleSellerProvider.notifier).prepareForNewSale();
    expect(container.read(saleSellerProvider)?.id, matchingSeller.id);
  });

  test('não seleciona default se o operador não está na lista', () async {
    final ProviderContainer container = buildContainer(
      sellers: const <Seller>[otherSeller],
      operator: testOperator,
    );
    addTearDown(container.dispose);

    container.read(saleSellerProvider);
    await container.read(terminalSellersProvider.future);
    container.read(saleSellerProvider.notifier).ensureDefaultSeller();
    expect(container.read(saleSellerProvider), isNull);
  });

  test('trocar de operador reaplica o vendedor default do novo operador',
      () async {
    final _MutableSession session = _MutableSession(testOperator);
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        terminalSellersProvider.overrideWith(
          (Ref ref) async => const <Seller>[matchingSeller, otherSeller],
        ),
        operatorSessionProvider.overrideWith(() => session),
      ],
    );
    addTearDown(container.dispose);

    container.read(saleSellerProvider);
    await container.read(terminalSellersProvider.future);
    container.read(saleSellerProvider.notifier).ensureDefaultSeller();
    expect(container.read(saleSellerProvider)?.id, matchingSeller.id);

    // Troca de operador: o vendedor antigo não pode ficar grudado.
    session.setOperator(
      const PosOperator(
        id: 'other',
        code: '99',
        name: 'Outro Vendedor',
        permissionIds: <String>['pdv.operacao.venda.create'],
      ),
    );
    await Future<void>.microtask(() {});
    expect(container.read(saleSellerProvider)?.id, otherSeller.id);
  });

  test('switchOperator (via null) não deixa o vendedor antigo — Op2 é vendedor',
      () async {
    final _MutableSession session = _MutableSession(testOperator);
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        terminalSellersProvider.overrideWith(
          (Ref ref) async => const <Seller>[matchingSeller, otherSeller],
        ),
        operatorSessionProvider.overrideWith(() => session),
      ],
    );
    addTearDown(container.dispose);

    container.read(saleSellerProvider);
    await container.read(terminalSellersProvider.future);
    container.read(saleSellerProvider.notifier).ensureDefaultSeller();
    expect(container.read(saleSellerProvider)?.id, matchingSeller.id);

    // Produção: switchOperator() → null → login Op2.
    session.setOperator(null);
    await Future<void>.microtask(() {});
    session.setOperator(
      const PosOperator(
        id: 'other',
        code: '99',
        name: 'Outro Vendedor',
        permissionIds: <String>['pdv.operacao.venda.create'],
      ),
    );
    await Future<void>.microtask(() {});
    expect(container.read(saleSellerProvider)?.id, otherSeller.id);
  });

  test('switchOperator — Op2 não é vendedor → sem seleção default', () async {
    final _MutableSession session = _MutableSession(testOperator);
    final ProviderContainer container = ProviderContainer(
      overrides: <Override>[
        terminalSellersProvider.overrideWith(
          (Ref ref) async => const <Seller>[matchingSeller],
        ),
        operatorSessionProvider.overrideWith(() => session),
      ],
    );
    addTearDown(container.dispose);

    container.read(saleSellerProvider);
    await container.read(terminalSellersProvider.future);
    container.read(saleSellerProvider.notifier).ensureDefaultSeller();
    expect(container.read(saleSellerProvider)?.id, matchingSeller.id);

    session.setOperator(null);
    await Future<void>.microtask(() {});
    session.setOperator(
      const PosOperator(
        id: 'op-nao-vendedor',
        code: '77',
        name: 'Só Caixa',
        permissionIds: <String>['pdv.operacao.venda.create'],
      ),
    );
    await Future<void>.microtask(() {});
    expect(container.read(saleSellerProvider), isNull);
  });
}

class _FixedSession extends OperatorSessionController {
  _FixedSession(this._operator);

  final PosOperator _operator;

  @override
  PosOperator? build() => _operator;
}

class _MutableSession extends OperatorSessionController {
  _MutableSession(this._operator);

  PosOperator? _operator;

  @override
  PosOperator? build() => _operator;

  void setOperator(PosOperator? next) {
    _operator = next;
    state = next;
  }
}
