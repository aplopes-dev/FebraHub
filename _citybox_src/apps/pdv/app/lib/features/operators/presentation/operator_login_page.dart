import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/app/shell/pdv_back.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/operators/presentation/widgets/operator_pin_pad.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/ui/pdv_empty_state.dart';
import 'package:citybox_pdv/ui/pdv_error_state.dart';
import 'package:citybox_pdv/ui/pdv_loading_state.dart';

/// Entrada do operador no turno.
///
/// Lista à esquerda, teclado à direita: escolher **quem** e digitar o PIN são
/// dois gestos, e separá-los deixa a lista visível durante a digitação — quem
/// errou de pessoa percebe antes de gastar uma tentativa.
class OperatorLoginPage extends ConsumerStatefulWidget {
  const OperatorLoginPage({super.key});

  @override
  ConsumerState<OperatorLoginPage> createState() => _OperatorLoginPageState();
}

class _OperatorLoginPageState extends ConsumerState<OperatorLoginPage> {
  PosOperator? _selected;
  String _pin = '';
  String? _error;
  bool _submitting = false;

  Future<void> _submit() async {
    final PosOperator? operator = _selected;
    if (operator == null || _pin.length != posOperatorPinLength) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await ref
          .read(operatorSessionProvider.notifier)
          .signIn(code: operator.code, pin: _pin);
      // Sem navegar daqui: o redirect do router reage à sessão.
    } on PdvApiException catch (e) {
      if (mounted) {
        setState(() {
          _error = e.message;
          // Limpa o PIN, mantém o operador escolhido: quem errou o PIN vai
          // tentar de novo como a mesma pessoa.
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
    final String terminalName =
        ref.watch(deviceCredentialProvider)?.terminalName ?? '';

    return PdvScaffold(
      contentPadding: EdgeInsets.zero,
      appBar: PdvAppBarChrome(
        // Sem turno e sem operador: não há caixa a fechar.
        showCloseShift: false,
        child: Row(
          children: <Widget>[
            PdvAppBarButton(
              icon: Icons.chevron_left,
              label: 'Voltar',
              tooltip: 'Voltar',
              iconSize: PdvSizes.iconLg,
              onPressed: () => popOrHome(context),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.lg),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    terminalName,
                    style: PdvTypography.headingSm.copyWith(
                      color: PdvAppBarColors.foreground,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Expanded(
            child: operators.when(
              loading: () => const PdvLoadingState(),
              error:
                  (Object error, StackTrace _) => PdvErrorState(
                    message: '$error',
                    onRetry: () => ref.invalidate(terminalOperatorsProvider),
                  ),
              data: (List<PosOperator> list) {
                if (list.isEmpty) {
                  return const PdvEmptyState(
                    title: 'Nenhum operador cadastrado',
                    subtitle:
                        'Cadastre os operadores desta unidade no ERP, em '
                        'Ponto de venda → Operadores.',
                  );
                }
                return _OperatorList(
                  operators: list,
                  selected: _selected,
                  onSelected:
                      (PosOperator o) => setState(() {
                        _selected = o;
                        _pin = '';
                        _error = null;
                      }),
                );
              },
            ),
          ),
          const VerticalDivider(
            width: PdvSizes.borderWidth,
            color: PdvColors.border,
          ),
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  Text(
                    _selected?.name ?? 'Escolha o operador',
                    style: PdvTypography.headingMd.copyWith(
                      color:
                          _selected == null
                              ? PdvColors.textSecondary
                              : PdvColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: PdvSpacing.xl),
                  OperatorPinPad(
                    value: _pin,
                    enabled: _selected != null && !_submitting,
                    onChanged: (String v) => setState(() => _pin = v),
                    onSubmit: _submit,
                  ),
                  const SizedBox(height: PdvSpacing.lg),
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
        ],
      ),
    );
  }
}

class _OperatorList extends StatelessWidget {
  const _OperatorList({
    required this.operators,
    required this.selected,
    required this.onSelected,
  });

  final List<PosOperator> operators;
  final PosOperator? selected;
  final ValueChanged<PosOperator> onSelected;

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: PdvSpacing.md),
      itemCount: operators.length,
      itemBuilder: (BuildContext context, int index) {
        final PosOperator operator = operators[index];
        final bool isSelected = operator.id == selected?.id;

        return Material(
          color: isSelected ? PdvColors.surfaceMuted : Colors.transparent,
          child: InkWell(
            onTap: () => onSelected(operator),
            hoverColor: PdvAppBarColors.hover,
            child: SizedBox(
              height: PdvSizes.controlHeightLg,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.xl),
                child: Row(
                  children: <Widget>[
                    Icon(
                      operator.isSupervisor
                          ? Icons.shield_outlined
                          : Icons.person_outline,
                      size: PdvSizes.iconMd,
                      color:
                          isSelected ? PdvColors.info : PdvColors.textSecondary,
                    ),
                    const SizedBox(width: PdvSpacing.lg),
                    Expanded(
                      child: Text(
                        operator.label,
                        style: PdvTypography.bodyLg.copyWith(
                          color:
                              isSelected
                                  ? PdvColors.textPrimary
                                  : PdvColors.textSecondary,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
