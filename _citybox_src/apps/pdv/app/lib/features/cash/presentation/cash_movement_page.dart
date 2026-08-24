import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_back.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/format/pdv_currency.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/cash/application/cash_shift_controller.dart';
import 'package:citybox_pdv/features/cash/domain/cash_enums.dart';
import 'package:citybox_pdv/features/cash/domain/cash_movement.dart';
import 'package:citybox_pdv/features/cash/domain/cash_shift.dart';
import 'package:citybox_pdv/features/cash/domain/expected_drawer.dart';
import 'package:citybox_pdv/features/cash/presentation/widgets/cash_movement_history.dart';
import 'package:citybox_pdv/features/operators/application/operator_session_controller.dart';
import 'package:citybox_pdv/features/operators/application/supervisor_authorization.dart';
import 'package:citybox_pdv/features/operators/domain/pos_operator.dart';
import 'package:citybox_pdv/features/operators/presentation/offline_blocked_dialog.dart';
import 'package:citybox_pdv/features/operators/presentation/supervisor_authorization_dialog.dart';
import 'package:citybox_pdv/features/policies/application/pos_policy_controller.dart';
import 'package:citybox_pdv/features/policies/domain/pos_policy.dart';
import 'package:citybox_pdv/features/policies/presentation/exception_gate.dart';
import 'package:citybox_pdv/features/settings/application/terminal_settings_controller.dart';
import 'package:citybox_pdv/features/shared/application/connectivity_controller.dart';
import 'package:citybox_pdv/ui/pdv_app_bar_button.dart';
import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/ui/pdv_dialog.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';
import 'package:citybox_pdv/ui/pdv_money_field.dart';

/// Sangria e reforço de gaveta.
///
/// Duas colunas: lançar à esquerda, conferir à direita. É a mesma pergunta
/// vista dos dois lados — antes de sangrar, o operador quer ver quanto já
/// saiu — e separá-las em telas obrigaria a decorar o histórico e voltar.
class CashMovementPage extends ConsumerStatefulWidget {
  const CashMovementPage({super.key});

  @override
  ConsumerState<CashMovementPage> createState() => _CashMovementPageState();
}

class _CashMovementPageState extends ConsumerState<CashMovementPage> {
  CashMovementType _type = CashMovementType.withdrawal;
  late CashOperationType _operation = cashOperationsFor(_type).first;
  final TextEditingController _amount = TextEditingController();
  final TextEditingController _reason = TextEditingController();

  @override
  void dispose() {
    _amount.dispose();
    _reason.dispose();
    super.dispose();
  }

  bool get _isWithdrawal => _type == CashMovementType.withdrawal;

  void _selectOperation(CashOperationType operation) =>
      setState(() => _operation = operation);

  void _selectType(CashMovementType type) {
    setState(() {
      _type = type;
      // A operação escolhida pode não existir do outro lado — "pagamento a
      // fornecedor" não é reforço. Cair na primeira do novo lado evita um
      // `DropdownButton` com valor fora das opções, que lança.
      final List<CashOperationType> allowed = cashOperationsFor(type);
      if (!allowed.contains(_operation)) _operation = allowed.first;
    });
  }

  @override
  Widget build(BuildContext context) {
    final CashShift? shift = ref.watch(cashShiftProvider);
    final String terminalLabel =
        ref.watch(terminalSettingsProvider).terminalLabel;

    return CallbackShortcuts(
      bindings: <ShortcutActivator, VoidCallback>{
        const SingleActivator(LogicalKeyboardKey.escape, shift: true):
            () => popOrHome(context),
      },
      child: Focus(
        autofocus: true,
        child: PdvScaffold(
          contentPadding: EdgeInsets.zero,
          appBar: PdvAppBarChrome(
            child: Row(
              children: <Widget>[
                PdvAppBarButton(
                  icon: Icons.chevron_left,
                  label: 'Voltar',
                  secondaryLabel: '(Shift + Esc)',
                  tooltip: 'Voltar (Shift + Esc)',
                  iconSize: PdvSizes.iconLg,
                  onPressed: () => popOrHome(context),
                ),
                const _ToolbarSeparator(),
                Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: PdvSpacing.lg,
                  ),
                  child: Text(
                    terminalLabel,
                    style: PdvTypography.headingSm.copyWith(
                      color: PdvAppBarColors.foreground,
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
                child: _FormColumn(
                  type: _type,
                  operation: _operation,
                  amount: _amount,
                  reason: _reason,
                  onTypeChanged: _selectType,
                  onOperationChanged: _selectOperation,
                  onSubmit: _submit,
                ),
              ),
              const VerticalDivider(
                width: PdvSizes.borderWidth,
                color: PdvCounterColors.border,
              ),
              Expanded(
                child: CashMovementHistory(
                  movements: shift?.movements ?? const <CashMovement>[],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    final int amountCents = PdvMoneyField.centsOf(_amount);
    final String reason =
        _reason.text.trim().isEmpty ? _operation.label : _reason.text;
    final CashShift? shift = ref.read(cashShiftProvider);

    if (amountCents <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Informe um valor maior que zero.')),
      );
      return;
    }

    if (shift != null &&
        _isWithdrawal &&
        amountCents > expectedDrawerCents(shift)) {
      final bool? proceed = await showDialog<bool>(
        context: context,
        builder: (BuildContext ctx) {
          return AlertDialog(
            title: const Text('Sangria acima do esperado'),
            content: const PdvDialogBody(
              child: Text(
                'O valor é maior que o esperado em gaveta. Continuar?',
              ),
            ),
            actions: <Widget>[
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('Cancelar'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Continuar'),
              ),
            ],
          );
        },
      );
      if (proceed != true) return;
      if (!mounted) return;
    }

    // Sangria: (1) permissão `pdv.operacao.caixa.withdrawal` no operador da
    // sessão — senão pede PIN de quem tem; (2) alçada por valor (PosPolicy).
    // Reforço não passa por nenhum dos dois.
    SupervisorAuthorization? authorization;
    if (_isWithdrawal) {
      final PosOperator? sessionOperator = ref.read(operatorSessionProvider);
      if (sessionOperator == null || !sessionOperator.canWithdraw) {
        final bool online = ref.read(terminalOnlineProvider);
        if (!online) {
          await showOfflineBlockedDialog(
            context,
            operation: PosOperation.withdrawal,
          );
          return;
        }
        if (!mounted) return;
        final SupervisorAuthorization? permissionAuth =
            await requestSupervisorAuthorization(
              context,
              operation: PosOperation.withdrawal,
              requiredPermissionId: PosOperator.withdrawalPermission,
              authorizerLabel: 'Autorizador',
              detail:
                  'Sangria de ${formatCents(amountCents)}\n'
                  'Este operador não pode registrar sangria. '
                  'Chame quem tenha permissão.',
            );
        if (permissionAuth == null || !mounted) return;
        authorization = permissionAuth;
      }

      final PosPolicy policy = ref.read(posPolicyProvider);
      final ExceptionDecision decision = await requestException(
        context,
        ref,
        operation: PosOperation.withdrawal,
        amount: amountCents,
        detail:
            'Sangria de ${formatCents(amountCents)}\n'
            'Acima do limite de '
            '${formatCents(policy.withdrawalSupervisorAboveCents)} sem '
            'autorização.',
      );
      if (decision is ExceptionRefused || !mounted) return;
      if (decision is ExceptionAuthorized) {
        // Se a alçada também pediu alguém, esse nome prevalece no registro
        // (foi quem liberou o valor acima do limite).
        authorization = decision.authorization;
      }
    }

    try {
      final CashMovement movement =
          _isWithdrawal
              ? await ref
                  .read(cashShiftProvider.notifier)
                  .addWithdrawal(
                    amountCents: amountCents,
                    reason: reason,
                    operation: _operation,
                    authorization: authorization,
                  )
              : await ref
                  .read(cashShiftProvider.notifier)
                  .addReinforcement(
                    amountCents: amountCents,
                    reason: reason,
                    operation: _operation,
                  );
      if (!mounted) return;

      // Os campos são limpos em vez de a tela fechar: o histórico ao lado
      // acabou de receber a linha, e é ali que o operador confere antes de
      // lançar o próximo.
      _amount.clear();
      _reason.clear();
      setState(() {});

      await showDialog<void>(
        context: context,
        builder: (BuildContext ctx) {
          return AlertDialog(
            title: const Text('Comprovante'),
            content: PdvDialogBody(
              child: Text(
                '${movement.type == CashMovementType.withdrawal ? 'Sangria' : 'Reforço'}: '
                '${formatCents(movement.amountCents)}\n'
                '${movement.operation.label}\n'
                'Observação: ${movement.reason}',
                style: PdvTypography.bodyLg,
              ),
            ),
            actions: <Widget>[
              TextButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Impressão simulada.')),
                  );
                  Navigator.pop(ctx);
                },
                child: const Text('Imprimir'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
            ],
          );
        },
      );
    } on Object catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('$e')));
      }
    }
  }
}

/// Coluna esquerda: abas Sangria/Reforço e o formulário do lançamento.
class _FormColumn extends StatelessWidget {
  const _FormColumn({
    required this.type,
    required this.operation,
    required this.amount,
    required this.reason,
    required this.onTypeChanged,
    required this.onOperationChanged,
    required this.onSubmit,
  });

  final CashMovementType type;
  final CashOperationType operation;
  final TextEditingController amount;
  final TextEditingController reason;
  final ValueChanged<CashMovementType> onTypeChanged;
  final ValueChanged<CashOperationType> onOperationChanged;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    final bool isWithdrawal = type == CashMovementType.withdrawal;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Row(
          children: <Widget>[
            Expanded(
              child: _TypeTab(
                label: 'Sangria',
                icon: Icons.money_off,
                color: PdvColors.danger,
                selected: isWithdrawal,
                onPressed: () => onTypeChanged(CashMovementType.withdrawal),
              ),
            ),
            Expanded(
              child: _TypeTab(
                label: 'Reforço',
                icon: Icons.attach_money,
                color: PdvColors.success,
                selected: !isWithdrawal,
                onPressed: () => onTypeChanged(CashMovementType.reinforcement),
              ),
            ),
          ],
        ),
        Expanded(
          child: ListView(
            padding: const EdgeInsets.all(PdvSpacing.xl),
            children: <Widget>[
              _OperationField(
                type: type,
                value: operation,
                onChanged: onOperationChanged,
              ),
              const SizedBox(height: PdvSpacing.lg),
              PdvMoneyField(label: 'Valor', controller: amount),
              const SizedBox(height: PdvSpacing.lg),
              PdvFilledField(
                label: 'Observação',
                controller: reason,
                maxLines: 2,
              ),
              const SizedBox(height: PdvSpacing.xl),
              SizedBox(
                height: PdvSizes.controlHeightLg,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor:
                        isWithdrawal ? PdvColors.danger : PdvColors.success,
                    foregroundColor: PdvColors.background,
                  ),
                  onPressed: onSubmit,
                  child: Text(
                    isWithdrawal ? 'CONFIRMAR SANGRIA' : 'CONFIRMAR REFORÇO',
                    style: PdvTypography.label,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Aba de tipo, com a cor da semântica: sai dinheiro (vermelho) × entra
/// dinheiro (verde). O sublinhado marca a selecionada.
class _TypeTab extends StatelessWidget {
  const _TypeTab({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? PdvColors.surfaceMuted : Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        hoverColor: PdvAppBarColors.hover,
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: selected ? color : PdvCounterColors.border,
                width:
                    selected ? PdvSizes.borderWidthFocus : PdvSizes.borderWidth,
              ),
            ),
          ),
          padding: const EdgeInsets.symmetric(vertical: PdvSpacing.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Icon(icon, size: PdvSizes.iconLg, color: color),
              const SizedBox(height: PdvSpacing.xs),
              Text(
                label.toUpperCase(),
                style: PdvTypography.label.copyWith(
                  color:
                      selected
                          ? PdvColors.textPrimary
                          : PdvColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// "Tipo de Operação" — as opções mudam conforme a aba (ver
/// `cashOperationsFor`).
class _OperationField extends StatelessWidget {
  const _OperationField({
    required this.type,
    required this.value,
    required this.onChanged,
  });

  final CashMovementType type;
  final CashOperationType value;
  final ValueChanged<CashOperationType> onChanged;

  @override
  Widget build(BuildContext context) {
    final List<CashOperationType> options = cashOperationsFor(type);

    return InputDecorator(
      decoration: pdvFilledDecoration(label: 'Tipo de Operação'),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<CashOperationType>(
          value: value,
          isDense: true,
          isExpanded: true,
          dropdownColor: PdvColors.surface,
          style: PdvTypography.bodyLg.copyWith(color: PdvColors.textPrimary),
          onChanged: (CashOperationType? picked) {
            if (picked != null) onChanged(picked);
          },
          items: <DropdownMenuItem<CashOperationType>>[
            for (final CashOperationType option in options)
              DropdownMenuItem<CashOperationType>(
                value: option,
                child: Text(option.label),
              ),
          ],
        ),
      ),
    );
  }
}

class _ToolbarSeparator extends StatelessWidget {
  const _ToolbarSeparator();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: PdvSizes.borderWidthFocus,
      height: PdvSizes.appBarHeight,
      color: PdvAppBarColors.separator,
    );
  }
}
