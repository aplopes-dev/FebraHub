import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/core/theme/pdv_theme.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_error_state.dart';
import 'package:citybox_pdv/ui/pdv_loading_state.dart';

void main() {
  testWidgets('PdvEmptyState / Loading / Error usam tokens e textos', (
    WidgetTester tester,
  ) async {
    var retried = false;

    await tester.pumpWidget(
      MaterialApp(
        theme: PdvTheme.data(),
        home: Scaffold(
          body: Column(
            children: <Widget>[
              const Expanded(
                child: PdvEmptyState(
                  title: 'Nada aqui',
                  subtitle: 'Fixture vazia',
                ),
              ),
              const Expanded(child: PdvLoadingState(message: 'Carregando…')),
              Expanded(
                child: PdvErrorState(
                  message: 'Falhou a carga',
                  onRetry: () => retried = true,
                ),
              ),
            ],
          ),
        ),
      ),
    );

    expect(find.text('Nada aqui'), findsOneWidget);
    expect(find.text('Fixture vazia'), findsOneWidget);
    expect(find.text('Carregando…'), findsOneWidget);
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    expect(find.text('Falhou a carga'), findsOneWidget);
    expect(find.text('Tentar de novo'), findsOneWidget);

    await tester.tap(find.text('Tentar de novo'));
    await tester.pump();
    expect(retried, isTrue);

    final Text emptyTitle = tester.widget<Text>(find.text('Nada aqui'));
    expect(emptyTitle.style?.color, PdvTypography.headingSm.color);
  });
}
