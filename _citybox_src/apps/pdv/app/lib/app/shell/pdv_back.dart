import 'package:flutter/widgets.dart';
import 'package:go_router/go_router.dart';

import 'package:citybox_pdv/app/router/pdv_router.dart';

/// Regra única de "voltar" do PDV.
///
/// Desempilha se houver de onde (a tela foi aberta por `push` — detalhe da
/// venda, sangria), e cai na tela inicial quando não houver (a tela foi aberta
/// por `go`, que substitui a pilha em vez de empilhar).
///
/// Existe como função, e não copiada em cada `onPressed`, porque a versão
/// errada — `context.pop()` seco — **trava o app**: numa tela alcançada por
/// `go` não há rota anterior, o `pop` não faz nada e o operador fica preso
/// sem nenhuma saída visível.
void popOrHome(BuildContext context) {
  if (context.canPop()) {
    context.pop();
    return;
  }
  context.go(PdvRoutes.home);
}
