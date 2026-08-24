import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';

/// Bloqueia a tela depois de um tempo sem ninguém tocar nela.
///
/// Envolve o app inteiro e reinicia a contagem em **qualquer** ponteiro ou
/// tecla — inclusive dentro de diálogos, porque está acima do `Navigator`.
///
/// Desligado por padrão (`lockAfterMinutes == 0`). Num balcão movimentado o
/// bloqueio automático interrompe venda em andamento; quem liga é a loja onde
/// o terminal fica sozinho.
class InactivityLocker extends ConsumerStatefulWidget {
  const InactivityLocker({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<InactivityLocker> createState() => _InactivityLockerState();
}

class _InactivityLockerState extends ConsumerState<InactivityLocker> {
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _restart() {
    _timer?.cancel();

    final int minutes = ref.read(terminalSettingsProvider).lockAfterMinutes;
    // Sem operador não há o que bloquear — a tela de login já é a barreira.
    if (minutes <= 0 || ref.read(operatorSessionProvider) == null) return;

    _timer = Timer(Duration(minutes: minutes), () {
      if (mounted) ref.read(operatorLockedProvider.notifier).lock();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Reagenda quando a preferência ou a sessão mudam: ligar o bloqueio nas
    // configurações tem que valer sem reiniciar o app.
    ref.listen(terminalSettingsProvider, (_, __) => _restart());
    ref.listen(operatorSessionProvider, (_, __) => _restart());

    return Listener(
      // `behavior: deferToChild` seria insuficiente: o toque tem que contar
      // mesmo em área vazia da tela.
      behavior: HitTestBehavior.translucent,
      onPointerDown: (_) => _restart(),
      onPointerSignal: (_) => _restart(),
      child: Focus(
        canRequestFocus: false,
        skipTraversal: true,
        onKeyEvent: (FocusNode node, KeyEvent event) {
          _restart();
          return KeyEventResult.ignored;
        },
        child: widget.child,
      ),
    );
  }
}
