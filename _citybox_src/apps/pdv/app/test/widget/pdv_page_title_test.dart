import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/shell/pdv_page_title.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

// Cada teste chama `pushWithPageTitle` dentro de um `onPressed` — nunca de um
// `initState`/`dispose` — porque é assim que a função foi desenhada para ser
// usada (o Riverpod proíbe mutar provider durante o ciclo de vida de
// construção da árvore).
//
// As asserções leem `pageTitleOverrideProvider` pelo `ProviderContainer`, não por
// `find.text`: assim que a rota de origem fica coberta, o Flutter a marca como
// *offstage*, e os finders do `flutter_test` ignoram widgets offstage por
// padrão (`skipOffstage: true`). Ler o container é o jeito correto de
// verificar o estado de uma tela que não está mais em primeiro plano.
//
// Os `Scaffold`s de teste não têm `AppBar`, então não há botão de voltar para
// `tester.pageBack()` encontrar — o pop é feito direto pelo `navigatorKey`.

void main() {
  testWidgets('define o título ao empurrar e restaura o anterior ao voltar', (
    WidgetTester tester,
  ) async {
    final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
    late ProviderContainer container;

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          navigatorKey: navigatorKey,
          home: Scaffold(
            body: Consumer(
              builder: (BuildContext context, WidgetRef ref, _) {
                container = ProviderScope.containerOf(context);
                return ElevatedButton(
                  onPressed:
                      () => pushWithPageTitle<void>(
                        context,
                        ref,
                        title: 'Balcão',
                        builder:
                            (_) => const Scaffold(body: Text('tela do balcão')),
                      ),
                  child: const Text('ir'),
                );
              },
            ),
          ),
        ),
      ),
    );

    expect(container.read(pageTitleOverrideProvider), isNull);

    await tester.tap(find.text('ir'));
    await tester.pumpAndSettle();

    expect(find.text('tela do balcão'), findsOneWidget);
    expect(container.read(pageTitleOverrideProvider), 'Balcão');

    navigatorKey.currentState!.pop();
    await tester.pumpAndSettle();

    expect(container.read(pageTitleOverrideProvider), isNull);
  });

  testWidgets('restaura o título de quem chamou, não um valor fixo', (
    WidgetTester tester,
  ) async {
    // Duas telas empilhadas: se a segunda sempre restaurasse "Início", voltar
    // da terceira devolveria o nome errado assim que houver navegação em mais
    // de um nível.
    final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
    late ProviderContainer container;

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          navigatorKey: navigatorKey,
          home: Scaffold(
            body: Consumer(
              builder: (BuildContext context, WidgetRef ref, _) {
                container = ProviderScope.containerOf(context);
                return ElevatedButton(
                  onPressed:
                      () => pushWithPageTitle<void>(
                        context,
                        ref,
                        title: 'Balcão',
                        builder: (BuildContext balcaoContext) {
                          return Scaffold(
                            body: Consumer(
                              builder: (
                                BuildContext context,
                                WidgetRef ref,
                                _,
                              ) {
                                return ElevatedButton(
                                  onPressed:
                                      () => pushWithPageTitle<void>(
                                        balcaoContext,
                                        ref,
                                        title: 'Pagamento',
                                        builder:
                                            (_) => const Scaffold(
                                              body: Text('tela de pagamento'),
                                            ),
                                      ),
                                  child: const Text('ir para o pagamento'),
                                );
                              },
                            ),
                          );
                        },
                      ),
                  child: const Text('ir para o balcão'),
                );
              },
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('ir para o balcão'));
    await tester.pumpAndSettle();
    expect(container.read(pageTitleOverrideProvider), 'Balcão');

    await tester.tap(find.text('ir para o pagamento'));
    await tester.pumpAndSettle();
    expect(container.read(pageTitleOverrideProvider), 'Pagamento');

    navigatorKey.currentState!.pop();
    await tester.pumpAndSettle();

    expect(container.read(pageTitleOverrideProvider), 'Balcão');
  });
}
