import 'package:flutter/material.dart';

/// Retorno padrão para uma ação que ainda não tem tela ou comportamento.
///
/// Sem isto, um botão que não responde a nada faz o operador achar que o app
/// travou. Compartilhado porque o app inteiro ainda está sendo construído
/// tela por tela — várias ações caem aqui até ganharem destino de verdade.
void showNotImplementedFeedback(BuildContext context, String label) {
  ScaffoldMessenger.of(context)
    // Sem isto, apertar várias ações em sequência enfileira vários avisos e o
    // último aparece segundos depois — já fora de contexto.
    ..clearSnackBars()
    ..showSnackBar(
      SnackBar(
        content: Text('$label — ainda não construído.'),
        duration: const Duration(milliseconds: 1600),
      ),
    );
}
