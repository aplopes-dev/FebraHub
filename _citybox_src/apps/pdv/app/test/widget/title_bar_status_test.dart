import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:citybox_pdv/app/shell/widgets/title_bar_status.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/shared/domain/sync_status.dart';

/// Monta só o bloco de status, com a saúde dos canais controlada pelo teste.
///
/// Este bloco não toca em canal nativo nenhum — por isso é testável direto,
/// diferente da barra inteira, que fala com o gerenciador de janelas.
Future<void> _pumpStatus(
  WidgetTester tester, {
  required SyncStatus status,
  DateTime? now,
}) {
  return tester.pumpWidget(
    ProviderScope(
      overrides: <Override>[
        syncStatusProvider.overrideWithValue(status),
        // Relógio fixo: o aviso de cache vencendo é medido contra ele, e o
        // `Stream.periodic` real deixaria um timer pendente no fim do teste.
        if (now != null)
          clockProvider.overrideWith((Ref ref) => Stream<DateTime>.value(now)),
      ],
      child: const MaterialApp(home: Scaffold(body: TitleBarStatus())),
    ),
  );
}

final DateTime _now = DateTime.utc(2026, 8, 6, 12);

void main() {
  testWidgets('anuncia os dois canais quando tudo está saudável', (
    WidgetTester tester,
  ) async {
    await _pumpStatus(
      tester,
      now: _now,
      status: const SyncStatus(
        network: ChannelHealth.ok,
        fiscal: ChannelHealth.ok,
        pendingSales: 0,
      ),
    );

    expect(
      find.bySemanticsLabel('Conexão com o servidor: Online'),
      findsOneWidget,
    );
    expect(
      find.bySemanticsLabel(
        'Sefaz (NFC-e / SAT / MFE): Autorizando normalmente',
      ),
      findsOneWidget,
    );
  });

  testWidgets('canal fora do ar é anunciado com o efeito prático', (
    WidgetTester tester,
  ) async {
    await _pumpStatus(
      tester,
      now: _now,
      status: const SyncStatus(
        network: ChannelHealth.down,
        fiscal: ChannelHealth.degraded,
        pendingSales: 0,
      ),
    );

    // O leitor de tela precisa dizer o que muda para o operador, não só que
    // "está vermelho".
    expect(
      find.bySemanticsLabel(
        'Conexão com o servidor: Sem conexão — vendas ficam no terminal',
      ),
      findsOneWidget,
    );
    expect(
      find.bySemanticsLabel(
        'Sefaz (NFC-e / SAT / MFE): NF configurada · emissão ainda não no PDV',
      ),
      findsOneWidget,
    );
  });

  group('Entrada sem rede', () {
    testWidgets('cache saudável não ocupa espaço na barra', (
      WidgetTester tester,
    ) async {
      await _pumpStatus(
        tester,
        now: _now,
        status: SyncStatus(
          network: ChannelHealth.ok,
          fiscal: ChannelHealth.ok,
          pendingSales: 0,
          offlineCacheExpiresAt: _now.add(const Duration(hours: 40)),
        ),
      );
      await tester.pump();

      // Indicador permanente de "está tudo bem" só consome a barra o dia
      // inteiro para informar o normal.
      expect(find.bySemanticsLabel(RegExp('Entrada sem rede')), findsNothing);
    });

    testWidgets('avisa antes de vencer, mesmo com o terminal online', (
      WidgetTester tester,
    ) async {
      await _pumpStatus(
        tester,
        now: _now,
        status: SyncStatus(
          network: ChannelHealth.ok,
          fiscal: ChannelHealth.ok,
          pendingSales: 0,
          offlineCacheExpiresAt: _now.add(const Duration(hours: 5)),
        ),
      );
      await tester.pump();

      // Avisar só depois de a rede cair seria avisar tarde: com link, o
      // operador resolve sozinho.
      expect(
        find.bySemanticsLabel(
          'Entrada sem rede: Vence em menos de um dia — conecte à rede da '
          'loja para renovar',
        ),
        findsOneWidget,
      );
    });

    testWidgets('cache vencido diz o efeito prático', (
      WidgetTester tester,
    ) async {
      await _pumpStatus(
        tester,
        now: _now,
        status: SyncStatus(
          network: ChannelHealth.down,
          fiscal: ChannelHealth.ok,
          pendingSales: 0,
          offlineCacheExpiresAt: _now.subtract(const Duration(hours: 1)),
        ),
      );
      await tester.pump();

      expect(
        find.bySemanticsLabel(
          'Entrada sem rede: Indisponível — sem rede, ninguém consegue entrar '
          'neste terminal',
        ),
        findsOneWidget,
      );
    });

    testWidgets('nunca sincronizado só vira aviso quando a rede cai', (
      WidgetTester tester,
    ) async {
      await _pumpStatus(
        tester,
        now: _now,
        status: const SyncStatus(
          network: ChannelHealth.ok,
          fiscal: ChannelHealth.ok,
          pendingSales: 0,
        ),
      );
      await tester.pump();
      expect(find.bySemanticsLabel(RegExp('Entrada sem rede')), findsNothing);

      await _pumpStatus(
        tester,
        now: _now,
        status: const SyncStatus(
          network: ChannelHealth.down,
          fiscal: ChannelHealth.ok,
          pendingSales: 0,
        ),
      );
      await tester.pump();
      expect(find.bySemanticsLabel(RegExp('Entrada sem rede')), findsOneWidget);
    });
  });
}
