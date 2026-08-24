import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/counter/application/counter_cart_controller.dart';
import 'package:citybox_pdv/features/counter/domain/counter_cart_line.dart';
import 'package:citybox_pdv/features/counter/domain/counter_product.dart';
import 'package:citybox_pdv/features/counter/presentation/widgets/counter_cart_table.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';

const CounterProduct _cola = CounterProduct(
  id: 'coca_1l',
  name: 'Coca Cola 1 Litro',
  priceCents: 1000,
  categoryId: 'bebidas',
);

const CounterProduct _agua = CounterProduct(
  id: 'agua_com_gas',
  name: 'Água Mineral c/ Gás',
  priceCents: 300,
  categoryId: 'bebidas',
);

Future<ProviderContainer> _pumpTable(
  WidgetTester tester, {
  List<Override> overrides = const <Override>[],
  Size size = const Size(1000, 800),
}) async {
  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.reset);

  late ProviderContainer container;
  await tester.pumpWidget(
    ProviderScope(
      overrides: overrides,
      child: MaterialApp(
        theme: PdvTheme.data(),
        home: Scaffold(
          body: Consumer(
            builder: (BuildContext context, WidgetRef ref, _) {
              container = ProviderScope.containerOf(context);
              return const CounterCartTable();
            },
          ),
        ),
      ),
    ),
  );
  return container;
}

void main() {
  testWidgets('cabeçalho das colunas em maiúsculas', (
    WidgetTester tester,
  ) async {
    await _pumpTable(tester);

    expect(find.text('PRODUTO'), findsOneWidget);
    expect(find.text('QNT.'), findsOneWidget);
    expect(find.text('VALOR UNIT.'), findsOneWidget);
    // "%" no cabeçalho — o desconto virou percentual, não mais reais.
    expect(find.text('DESCONTO %'), findsOneWidget);
    expect(find.text('VALOR TOTAL'), findsOneWidget);
  });

  testWidgets('carrinho vazio mostra "Sem produtos"', (
    WidgetTester tester,
  ) async {
    await _pumpTable(tester);

    expect(find.text('Sem produtos'), findsOneWidget);
    expect(find.byType(PdvEmptyState), findsOneWidget);
  });

  testWidgets(
    'linha lançada mostra produto, quantidade, valor unitário e desconto em %',
    (WidgetTester tester) async {
      await _pumpTable(
        tester,
        overrides: <Override>[
          counterCartProvider.overrideWith(
            () => _FixedCart(<CounterCartLine>[
              const CounterCartLine(
                product: _cola,
                quantity: 2,
                discountPercent: 10,
              ),
            ]),
          ),
        ],
      );

      expect(find.text('Sem produtos'), findsNothing);
      expect(find.text('Coca Cola 1 Litro'), findsOneWidget);
      expect(find.text('2'), findsOneWidget);
      expect(find.text(formatCents(1000)), findsOneWidget);
      expect(find.text('10%'), findsOneWidget);
      // Subtotal 20, 10% de desconto = 2 — total 18.
      expect(find.text(formatCents(1800)), findsOneWidget);
    },
  );

  testWidgets(
    'as colunas fixas mantêm a largura; a de produto absorve o resto',
    (WidgetTester tester) async {
      Future<Rect> totalColumnRect(double tableWidth) async {
        await _pumpTable(
          tester,
          size: Size(tableWidth, 800),
          overrides: <Override>[
            counterCartProvider.overrideWith(
              () => _FixedCart(<CounterCartLine>[
                const CounterCartLine(product: _cola, quantity: 2),
              ]),
            ),
          ],
        );
        return tester.getRect(
          find
              .ancestor(
                of: find.text(formatCents(2000)),
                matching: find.byType(SizedBox),
              )
              .first,
        );
      }

      final Rect narrow = await totalColumnRect(900);
      final Rect wide = await totalColumnRect(1400);

      // Mesma largura nos dois tamanhos — é fixa, não proporcional à tabela.
      expect(wide.width, closeTo(narrow.width, 1));
      // E fica mais para a direita na tabela larga: quem cresceu foi a
      // coluna de produto à esquerda dela, não ela.
      expect(wide.left, greaterThan(narrow.left));
    },
  );

  testWidgets(
    'há folga maior entre o botão de remover/editar e as colunas vizinhas',
    (WidgetTester tester) async {
      await _pumpTable(
        tester,
        overrides: <Override>[
          counterCartProvider.overrideWith(
            () => _FixedCart(<CounterCartLine>[
              const CounterCartLine(product: _cola, quantity: 2),
            ]),
          ),
        ],
      );

      final Rect removeButton = tester.getRect(
        find.byTooltip('Remover ${_cola.name}'),
      );
      final Rect productName = tester.getRect(find.text('Coca Cola 1 Litro'));
      final Rect editButton = tester.getRect(
        find.byTooltip('Editar ${_cola.name}'),
      );
      final Rect quantityCell = tester.getRect(find.text('2'));

      // PdvSpacing.lg (16) — bem mais que o vão de PdvSpacing.sm (8) usado
      // entre as colunas fixas de números.
      expect(productName.left - removeButton.right, greaterThanOrEqualTo(16));
      expect(quantityCell.left - editButton.right, greaterThanOrEqualTo(16));
    },
  );

  testWidgets('o botão de remover é vermelho', (WidgetTester tester) async {
    await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 2),
          ]),
        ),
      ],
    );

    final Icon removeIcon = tester.widget<Icon>(
      find.descendant(
        of: find.byTooltip('Remover ${_cola.name}'),
        matching: find.byIcon(Icons.delete_outline),
      ),
    );

    expect(removeIcon.color, PdvCounterColors.danger);
  });

  testWidgets('passar o mouse sobre a linha destaca o fundo dela', (
    WidgetTester tester,
  ) async {
    await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 2),
          ]),
        ),
      ],
    );

    ColoredBox rowBox() => tester.widget<ColoredBox>(
      find
          .ancestor(
            of: find.text('Coca Cola 1 Litro'),
            matching: find.byType(ColoredBox),
          )
          .first,
    );

    expect(rowBox().color, Colors.transparent);

    final TestGesture gesture = await tester.createGesture(
      kind: PointerDeviceKind.mouse,
    );
    addTearDown(gesture.removePointer);
    await gesture.addPointer(location: Offset.zero);
    await tester.pump();

    await gesture.moveTo(tester.getCenter(find.text('Coca Cola 1 Litro')));
    await tester.pump();

    expect(rowBox().color, PdvCounterColors.surfaceHover);
  });

  testWidgets('tocar no botão de remover tira a linha do carrinho', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 2),
          ]),
        ),
      ],
    );

    await tester.tap(find.byTooltip('Remover ${_cola.name}'));
    await tester.pump();

    expect(container.read(counterCartProvider), isEmpty);
    expect(find.text('Coca Cola 1 Litro'), findsNothing);
  });

  testWidgets('remover não afeta as outras linhas', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 1),
            const CounterCartLine(product: _agua, quantity: 1),
          ]),
        ),
      ],
    );

    await tester.tap(find.byTooltip('Remover ${_cola.name}'));
    await tester.pump();

    final List<CounterCartLine> cart = container.read(counterCartProvider);
    expect(cart, hasLength(1));
    expect(cart.single.product, _agua);
  });

  testWidgets(
    'tocar em editar mostra campos de quantidade e desconto, nunca de valor unitário',
    (WidgetTester tester) async {
      await _pumpTable(
        tester,
        overrides: <Override>[
          counterCartProvider.overrideWith(
            () => _FixedCart(<CounterCartLine>[
              const CounterCartLine(product: _cola, quantity: 2),
            ]),
          ),
        ],
      );

      expect(find.text('Salvar'), findsNothing);
      expect(find.byType(TextField), findsNothing);

      await tester.tap(find.byTooltip('Editar ${_cola.name}'));
      await tester.pump();

      expect(find.text('Salvar'), findsOneWidget);
      expect(find.byTooltip('Editar ${_cola.name}'), findsNothing);
      // Só dois campos — quantidade e desconto. Valor unitário não vira
      // campo em nenhuma hipótese: vem do catálogo.
      expect(find.byType(TextField), findsNWidgets(2));
      expect(
        find.byKey(const ValueKey<String>('cart_line_quantity_field')),
        findsOneWidget,
      );
      expect(
        find.byKey(const ValueKey<String>('cart_line_discount_field')),
        findsOneWidget,
      );
      // O valor unitário continua mostrado, só que como texto estático.
      expect(find.text(formatCents(1000)), findsOneWidget);

      final TextField quantityField = tester.widget<TextField>(
        find.descendant(
          of: find.byKey(const ValueKey<String>('cart_line_quantity_field')),
          matching: find.byType(TextField),
        ),
      );
      expect(quantityField.controller?.text, '2');
      // "Campo de number" — teclado numérico dedicado, não texto genérico.
      expect(quantityField.keyboardType, TextInputType.number);
    },
  );

  testWidgets(
    'a caixa dos campos de edição tem a mesma altura da linha em exibição',
    (WidgetTester tester) async {
      await _pumpTable(
        tester,
        overrides: <Override>[
          counterCartProvider.overrideWith(
            () => _FixedCart(<CounterCartLine>[
              const CounterCartLine(product: _cola, quantity: 2),
            ]),
          ),
        ],
      );

      // A altura da própria linha (o `Row` que contém tudo) — pega pelo
      // ancestral do nome do produto, duas camadas acima do texto.
      final double rowHeightBeforeEditing =
          tester
              .getRect(
                find
                    .ancestor(
                      of: find.text('Coca Cola 1 Litro'),
                      matching: find.byType(Row),
                    )
                    .last,
              )
              .height;

      await tester.tap(find.byTooltip('Editar ${_cola.name}'));
      await tester.pump();

      final double rowHeightWhileEditing =
          tester
              .getRect(
                find
                    .ancestor(
                      of: find.byKey(
                        const ValueKey<String>('cart_line_quantity_field'),
                      ),
                      matching: find.byType(Row),
                    )
                    .last,
              )
              .height;

      expect(rowHeightWhileEditing, closeTo(rowHeightBeforeEditing, 0.5));
    },
  );

  testWidgets(
    'o preenchimento dos campos ocupa a linha inteira, não só o topo',
    (WidgetTester tester) async {
      await _pumpTable(
        tester,
        overrides: <Override>[
          counterCartProvider.overrideWith(
            () => _FixedCart(<CounterCartLine>[
              const CounterCartLine(
                product: _cola,
                quantity: 2,
                discountPercent: 10,
              ),
            ]),
          ),
        ],
      );

      await tester.tap(find.byTooltip('Editar ${_cola.name}'));
      await tester.pump();

      // Medir a caixa do campo (`getRect` do próprio `TextField`) não
      // discrimina o defeito — o `Row` esticado por fora já garante essa
      // altura mesmo com o `InputDecorator` encolhido por dentro (foi
      // exatamente o que acontecia aqui antes do `expands: true`: a caixa
      // media os 36 px certos, mas o preenchimento e o texto ficavam colados
      // no topo, com a metade de baixo mostrando o fundo por trás). O que
      // denuncia é onde o texto digitado fica: centrado na célula com o
      // campo esticado, colado no topo sem.
      final Rect quantityField = tester.getRect(
        find.byKey(const ValueKey<String>('cart_line_quantity_field')),
      );
      final Rect quantityDigits = tester.getRect(find.text('2'));
      expect(quantityDigits.center.dy, closeTo(quantityField.center.dy, 1));

      final Rect discountField = tester.getRect(
        find.byKey(const ValueKey<String>('cart_line_discount_field')),
      );
      // Pré-preenchido sem casa decimal — desconto é sempre inteiro.
      final Rect discountDigits = tester.getRect(find.text('10'));
      expect(discountDigits.center.dy, closeTo(discountField.center.dy, 1));
    },
  );

  testWidgets('salvar grava quantidade e desconto (percentual) editados', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 2),
          ]),
        ),
      ],
    );

    await tester.tap(find.byTooltip('Editar ${_cola.name}'));
    await tester.pump();

    await tester.enterText(
      find.byKey(const ValueKey<String>('cart_line_quantity_field')),
      '5',
    );
    await tester.enterText(
      find.byKey(const ValueKey<String>('cart_line_discount_field')),
      '10',
    );

    await tester.tap(find.text('Salvar'));
    await tester.pump();

    final CounterCartLine line = container.read(counterCartProvider).single;
    expect(line.quantity, 5);
    expect(line.discountPercent, 10);
    // Valor unitário nunca muda — continua o do catálogo.
    expect(line.unitPriceCents, _cola.priceCents);
    // Voltou ao modo de exibição.
    expect(find.text('Salvar'), findsNothing);
    expect(find.byTooltip('Editar ${_cola.name}'), findsOneWidget);
  });

  testWidgets('salvar com quantidade vazia avisa e não sai da edição', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 2),
          ]),
        ),
      ],
    );

    await tester.tap(find.byTooltip('Editar ${_cola.name}'));
    await tester.pump();

    await tester.enterText(
      find.byKey(const ValueKey<String>('cart_line_quantity_field')),
      '',
    );
    await tester.tap(find.text('Salvar'));
    await tester.pump();

    expect(
      find.text(
        'Quantidade precisa ser maior que zero; desconto, um número '
        'inteiro de 1 a 100 (ou vazio, para nenhum).',
      ),
      findsOneWidget,
    );
    // Continua editando — nada foi gravado.
    expect(find.text('Salvar'), findsOneWidget);
    expect(container.read(counterCartProvider).single.quantity, 2);
  });

  testWidgets('desconto fora do intervalo 1–100 é rejeitado, não gravado', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(
              product: _cola,
              quantity: 1,
              discountPercent: 20,
            ),
          ]),
        ),
      ],
    );

    await tester.tap(find.byTooltip('Editar ${_cola.name}'));
    await tester.pump();

    await tester.enterText(
      find.byKey(const ValueKey<String>('cart_line_discount_field')),
      '150',
    );
    await tester.tap(find.text('Salvar'));
    await tester.pump();

    // Nem clampado, nem salvo — a linha continua com o desconto anterior.
    expect(container.read(counterCartProvider).single.discountPercent, 20);
    expect(find.text('Salvar'), findsOneWidget);
  });

  testWidgets('desconto 100 (o teto) é aceito e grava normalmente', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(product: _cola, quantity: 1),
          ]),
        ),
      ],
    );

    await tester.tap(find.byTooltip('Editar ${_cola.name}'));
    await tester.pump();

    await tester.enterText(
      find.byKey(const ValueKey<String>('cart_line_discount_field')),
      '100',
    );
    await tester.tap(find.text('Salvar'));
    await tester.pump();

    final CounterCartLine line = container.read(counterCartProvider).single;
    expect(line.discountPercent, 100);
    expect(line.totalCents, 0);
  });

  testWidgets('desconto 0 digitado à mão é rejeitado — só em branco vale', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(
              product: _cola,
              quantity: 1,
              discountPercent: 20,
            ),
          ]),
        ),
      ],
    );

    await tester.tap(find.byTooltip('Editar ${_cola.name}'));
    await tester.pump();

    await tester.enterText(
      find.byKey(const ValueKey<String>('cart_line_discount_field')),
      '0',
    );
    await tester.tap(find.text('Salvar'));
    await tester.pump();

    expect(container.read(counterCartProvider).single.discountPercent, 20);
    expect(find.text('Salvar'), findsOneWidget);
  });

  testWidgets('desconto deixado em branco ao salvar vira 0%, não bloqueia', (
    WidgetTester tester,
  ) async {
    final ProviderContainer container = await _pumpTable(
      tester,
      overrides: <Override>[
        counterCartProvider.overrideWith(
          () => _FixedCart(<CounterCartLine>[
            const CounterCartLine(
              product: _cola,
              quantity: 1,
              discountPercent: 10,
            ),
          ]),
        ),
      ],
    );

    await tester.tap(find.byTooltip('Editar ${_cola.name}'));
    await tester.pump();

    await tester.enterText(
      find.byKey(const ValueKey<String>('cart_line_discount_field')),
      '',
    );
    await tester.tap(find.text('Salvar'));
    await tester.pump();

    expect(container.read(counterCartProvider).single.discountPercent, 0);
  });
}

class _FixedCart extends CounterCartController {
  _FixedCart(this._lines);

  final List<CounterCartLine> _lines;

  @override
  List<CounterCartLine> build() => _lines;
}
