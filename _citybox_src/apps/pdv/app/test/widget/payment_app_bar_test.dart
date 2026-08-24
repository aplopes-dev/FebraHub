import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_customer_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/modules/application/module_visibility_controller.dart';
import 'package:citybox_pdv/features/modules/domain/module_ids.dart';
import 'package:citybox_pdv/features/payment/presentation/widgets/payment_app_bar.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

import '../helpers/fixed_module_visibility.dart';

/// Largura da janela nos testes desta barra. Como no Balcão, o padrão de teste
/// (800×600) é menor que o `minimumSize` de produção (1024×640) e estoura a
/// linha — esta tela tem ainda mais botões que a de lá.
const double _windowWidth = 1280;

Future<void> _pumpBar(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
}) {
  tester.view.physicalSize = const Size(_windowWidth, 800);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  return tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[
        establishmentNameProvider.overrideWithValue('Loja Centro'),
        ...overrides,
      ],
      child: const MaterialApp(home: Scaffold(body: PaymentAppBar())),
    ),
  );
}

/// Estado fixo do cliente da venda, para testar a barra com um nome longo sem
/// depender de uma tela de seleção.
class _FixedCustomer extends CounterCustomerController {
  _FixedCustomer(this._customer);

  final Customer _customer;

  @override
  Customer? build() => _customer;
}

void main() {
  testWidgets('as ações da direita encostam na margem da barra', (
    WidgetTester tester,
  ) async {
    await _pumpBar(tester);

    // A última ação da linha — o nome da loja — define a borda do grupo: se
    // sobrar espaço depois dela, os botões descolaram da margem. Foi o que
    // aconteceu enquanto o botão do cliente (`Flexible`) dividia o espaço
    // livre com um `Spacer` — metade da folga ficava encalhada no fim do
    // `Row`.
    expect(
      tester.getTopRight(find.byTooltip('Loja Centro')).dx,
      moreOrLessEquals(_windowWidth - PdvSpacing.lg),
    );
  });

  testWidgets('nome de cliente longo não descola as ações da margem', (
    WidgetTester tester,
  ) async {
    await _pumpBar(
      tester,
      overrides: <Override>[
        counterCustomerProvider.overrideWith(
          () => _FixedCustomer(
            const Customer(
              id: 'cust_long',
              name:
                  'Distribuidora de Bebidas e Conveniência Santo Antônio LTDA ME',
            ),
          ),
        ),
      ],
    );

    expect(
      tester.getTopRight(find.byTooltip('Loja Centro')).dx,
      moreOrLessEquals(_windowWidth - PdvSpacing.lg),
    );
  });

  testWidgets('mantém as ações da tela na ordem esperada', (
    WidgetTester tester,
  ) async {
    await _pumpBar(tester);

    expect(find.text('VOLTAR'), findsOneWidget);
    expect(find.text('LOJA CENTRO'), findsOneWidget);

    final double vendedor = tester.getTopLeft(find.byTooltip('Vendedor')).dx;
    final double observacao =
        tester.getTopLeft(find.byTooltip('Observação da venda')).dx;
    final double config = tester.getTopLeft(find.byTooltip('Configurações')).dx;
    final double loja = tester.getTopLeft(find.byTooltip('Loja Centro')).dx;

    // O nome da loja fecha a linha, encostado no canto — a mesma posição que
    // ocupa na app bar do Balcão.
    expect(vendedor, lessThan(observacao));
    expect(observacao, lessThan(config));
    expect(config, lessThan(loja));
  });

  testWidgets('sem Vendedor na app bar quando seller não está available', (
    WidgetTester tester,
  ) async {
    await _pumpBar(
      tester,
      overrides: <Override>[
        moduleVisibilityProvider.overrideWith(
          () => FixedModuleVisibilityController(
            disabled: <String>{PdvModuleIds.seller},
            enforceCoreValidation: false,
          ),
        ),
      ],
    );

    expect(find.byTooltip('Vendedor'), findsNothing);
    expect(find.byTooltip('Observação da venda'), findsOneWidget);
    expect(find.text('VOLTAR'), findsOneWidget);
  });
}
