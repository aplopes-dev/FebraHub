import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/operators/presentation/widgets/operator_pin_pad.dart';

/// Tela bloqueada, por cima de tudo.
///
/// **Não é logout.** Turno aberto, carrinho montado e tela atual continuam
/// onde estavam — desbloquear devolve exatamente o que havia. É o que o
/// operador usa ao sair do caixa por um minuto, e é o que o tempo de
/// inatividade dispara.
///
/// Montado no `builder` do `MaterialApp`, e não numa rota: por cima do
/// `Navigator` ele cobre também diálogos abertos, que uma rota nova deixaria
/// visíveis por baixo.
class OperatorLockOverlay extends ConsumerStatefulWidget {
  const OperatorLockOverlay({required this.child, super.key});

  final Widget child;

  @override
  ConsumerState<OperatorLockOverlay> createState() =>
      _OperatorLockOverlayState();
}

class _OperatorLockOverlayState extends ConsumerState<OperatorLockOverlay> {
  String _pin = '';
  String? _error;
  bool _submitting = false;

  Future<void> _unlock() async {
    if (_pin.length != posOperatorPinLength) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      await ref.read(operatorSessionProvider.notifier).unlockWith(_pin);
      if (mounted) setState(() => _pin = '');
    } on PdvApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          _pin = '';
        });
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool locked = ref.watch(operatorLockedProvider);
    final PosOperator? operator = ref.watch(operatorSessionProvider);

    return Stack(
      children: <Widget>[
        widget.child,
        if (locked && operator != null)
          // `ModalBarrier` sem `dismissible`: o único jeito de sair é o PIN.
          Positioned.fill(
            child: ColoredBox(
              color: PdvColors.surfaceOverlay,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    const Icon(
                      Icons.lock_outline,
                      size: PdvSizes.iconXl,
                      color: PdvColors.info,
                    ),
                    const SizedBox(height: PdvSpacing.lg),
                    Text(
                      'Tela bloqueada',
                      style: PdvTypography.headingLg.copyWith(
                        color: PdvColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: PdvSpacing.xs),
                    Text(
                      // Diz de quem é a sessão: quem chegou no caixa precisa
                      // saber se desbloqueia ou troca de operador.
                      '${operator.name} — informe o PIN para continuar',
                      style: PdvTypography.bodyMd.copyWith(
                        color: PdvColors.textSecondary,
                      ),
                    ),
                    const SizedBox(height: PdvSpacing.xxl),
                    OperatorPinPad(
                      value: _pin,
                      enabled: !_submitting,
                      onChanged: (String v) => setState(() => _pin = v),
                      onSubmit: _unlock,
                    ),
                    const SizedBox(height: PdvSpacing.lg),
                    SizedBox(
                      height: PdvSizes.controlHeight,
                      child:
                          _error == null
                              ? const SizedBox.shrink()
                              : Text(
                                _error!,
                                style: PdvTypography.bodyMd.copyWith(
                                  color: PdvColors.danger,
                                ),
                              ),
                    ),
                    TextButton(
                      onPressed: () {
                        // Trocar de operador daqui é a saída de quem não sabe o
                        // PIN de quem bloqueou — sem isso o caixa ficaria
                        // travado até a pessoa voltar.
                        ref
                            .read(operatorSessionProvider.notifier)
                            .switchOperator();
                      },
                      child: Text(
                        'TROCAR OPERADOR',
                        style: PdvTypography.label.copyWith(
                          color: PdvColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
