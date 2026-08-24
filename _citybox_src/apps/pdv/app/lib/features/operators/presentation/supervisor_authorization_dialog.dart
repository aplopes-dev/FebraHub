import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/application/supervisor_authorization.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/operators/presentation/widgets/operator_pin_pad.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';

/// Pede o PIN de quem tem [requiredPermissionId] para liberar uma operação.
///
/// Devolve quem autorizou, ou `null` se o operador desistiu. **Nunca devolve
/// "autorizado" sem alguém por trás**: quem chama grava o nome no registro, e
/// um retorno booleano deixaria a exceção sem responsável.
Future<SupervisorAuthorization?> requestSupervisorAuthorization(
  BuildContext context, {
  required PosOperation operation,
  String? detail,
  String requiredPermissionId = PosOperator.alcadaAuthorizePermission,
  String authorizerLabel = 'Supervisor',
}) {
  return showDialog<SupervisorAuthorization>(
    context: context,
    // Sem `barrierDismissible`: fechar sem querer no meio da digitação, com o
    // supervisor parado ao lado do caixa, faz recomeçar tudo.
    barrierDismissible: false,
    builder:
        (BuildContext context) => _SupervisorAuthorizationDialog(
          operation: operation,
          detail: detail,
          requiredPermissionId: requiredPermissionId,
          authorizerLabel: authorizerLabel,
        ),
  );
}

class _SupervisorAuthorizationDialog extends ConsumerStatefulWidget {
  const _SupervisorAuthorizationDialog({
    required this.operation,
    required this.requiredPermissionId,
    required this.authorizerLabel,
    this.detail,
  });

  final PosOperation operation;
  final String requiredPermissionId;
  final String authorizerLabel;

  /// O que está sendo autorizado, em números — "Desconto de 20%", "Sangria de
  /// R$ 800,00". Quem assina precisa ver o valor antes de digitar.
  final String? detail;

  @override
  ConsumerState<_SupervisorAuthorizationDialog> createState() =>
      _SupervisorAuthorizationDialogState();
}

class _SupervisorAuthorizationDialogState
    extends ConsumerState<_SupervisorAuthorizationDialog> {
  PosOperator? _selected;
  String _pin = '';
  String? _error;
  bool _submitting = false;

  Future<void> _submit() async {
    final PosOperator? authorizer = _selected;
    if (authorizer == null || _pin.length != posOperatorPinLength) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final SupervisorAuthorization authorization = await ref
          .read(supervisorAuthorizerProvider)
          .authorizeWithPermission(
            code: authorizer.code,
            pin: _pin,
            requiredPermissionId: widget.requiredPermissionId,
          );
      if (mounted) Navigator.of(context).pop(authorization);
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
    final AsyncValue<List<PosOperator>> operators = ref.watch(
      terminalOperatorsProvider,
    );

    // Só quem tem a permissão exigida. Oferecer todo mundo e recusar depois
    // gastaria uma tentativa de bloqueio de quem nunca poderia autorizar.
    final List<PosOperator> candidates =
        operators.valueOrNull
            ?.where(
              (PosOperator o) => o.hasPermission(widget.requiredPermissionId),
            )
            .toList() ??
        const <PosOperator>[];

    return AlertDialog(
      backgroundColor: PdvColors.surface,
      title: Text(
        'Autorização — ${widget.operation.label}',
      ),
      // Rolável: o teclado de PIN é alto de propósito (tecla de 72 px), e num
      // tablet em retrato o conjunto passa da altura da tela. Sem isto o
      // operador simplesmente não alcança as últimas teclas.
      content: SizedBox(
        width: 480,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: <Widget>[
              if (widget.detail != null) ...<Widget>[
                Text(
                  widget.detail!,
                  style: PdvTypography.bodyLg.copyWith(
                    color: PdvColors.textPrimary,
                  ),
                ),
                const SizedBox(height: PdvSpacing.lg),
              ],
              if (operators.isLoading)
                const Center(child: CircularProgressIndicator())
              else if (candidates.isEmpty)
                Text(
                  'Ninguém com permissão nesta unidade. Ajuste em '
                  'Configurações → Usuários e Permissões, no ERP.',
                  style: PdvTypography.bodyMd.copyWith(
                    color: PdvColors.textSecondary,
                  ),
                )
              else ...<Widget>[
                DropdownButtonFormField<PosOperator>(
                  initialValue: _selected,
                  decoration: InputDecoration(labelText: widget.authorizerLabel),
                  items:
                      candidates
                          .map(
                            (PosOperator o) => DropdownMenuItem<PosOperator>(
                              value: o,
                              child: Text(o.label),
                            ),
                          )
                          .toList(),
                  onChanged:
                      _submitting
                          ? null
                          : (PosOperator? o) => setState(() {
                            _selected = o;
                            _pin = '';
                            _error = null;
                          }),
                ),
                const SizedBox(height: PdvSpacing.xl),
                Center(
                  child: OperatorPinPad(
                    value: _pin,
                    enabled: _selected != null && !_submitting,
                    onChanged: (String v) => setState(() => _pin = v),
                    onSubmit: _submit,
                  ),
                ),
              ],
              SizedBox(
                height: PdvSizes.controlHeight,
                child: Center(
                  child:
                      _error == null
                          ? const SizedBox.shrink()
                          : Text(
                            _error!,
                            textAlign: TextAlign.center,
                            style: PdvTypography.bodyMd.copyWith(
                              color: PdvColors.danger,
                            ),
                          ),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: _submitting ? null : () => Navigator.of(context).pop(),
          child: const Text('Cancelar'),
        ),
      ],
    );
  }
}
