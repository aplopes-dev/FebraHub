import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

/// Empurra uma rota anunciando o nome dela no centro da barra de título, e
/// devolve o nome anterior quando ela for desempilhada.
///
/// **Só para o que o `go_router` não vê.** Rota de verdade tem o título
/// derivado do caminho (`pdvPageTitleForLocation`); esta função é para páginas
/// empurradas pelo `Navigator`, em que a URL não muda — hoje só o cadastro de
/// cliente aberto pelo seletor.
///
/// A troca acontece **aqui**, na ação que dispara a navegação, nunca dentro de
/// `initState`/`dispose` da tela de destino: o Riverpod proíbe mutar provider
/// durante a construção da árvore, e um `initState` no meio de um
/// `Navigator.push` cai exatamente nessa fase.
Future<T?> pushWithPageTitle<T>(
  BuildContext context,
  WidgetRef ref, {
  required String title,
  required WidgetBuilder builder,
}) async {
  final String? previousTitle = ref.read(pageTitleOverrideProvider);
  ref.read(pageTitleOverrideProvider.notifier).setTitle(title);

  final T? result = await Navigator.of(
    context,
  ).push<T>(MaterialPageRoute<T>(builder: builder));

  // O `ref` de quem chamou pode não existir mais quando a rota empurrada
  // fecha (o operador pode ter navegado várias telas adiante nesse meio
  // tempo) — mas o próprio `WidgetRef` do Riverpod já lança se isso
  // acontecer, então não precisamos de uma checagem extra de `mounted` aqui.
  // Volta ao que havia antes — quase sempre `null`, devolvendo o título para
  // a rota.
  ref.read(pageTitleOverrideProvider.notifier).setTitle(previousTitle);
  return result;
}
