import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_app_bar_chrome.dart';
import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/storage/secure_store_failure.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/features/terminal/domain/device_credential.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// Ativação do terminal — a primeira tela de um PDV recém-instalado.
///
/// É o único lugar do app alcançável sem credencial: o redirect do router
/// manda tudo para cá enquanto não houver pareamento. Não tem Voltar, e é
/// deliberado — não há para onde voltar antes de o terminal existir.
class ActivateTerminalPage extends ConsumerStatefulWidget {
  const ActivateTerminalPage({super.key});

  @override
  ConsumerState<ActivateTerminalPage> createState() =>
      _ActivateTerminalPageState();
}

class _ActivateTerminalPageState extends ConsumerState<ActivateTerminalPage> {
  final TextEditingController _code = TextEditingController();
  bool _submitting = false;
  String? _error;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  /// Como este dispositivo se apresenta na listagem de terminais do ERP.
  ///
  /// Sai do sistema operacional, não de um campo digitado: o gerente precisa
  /// reconhecer o que está revogando, e "Windows · PDV-CAIXA1" diz mais do que
  /// um rótulo que alguém esqueceu de preencher.
  String get _deviceLabel {
    final String os = switch (Platform.operatingSystem) {
      'windows' => 'Windows',
      'linux' => 'Linux',
      'macos' => 'macOS',
      'android' => 'Android',
      'ios' => 'iOS',
      final String other => other,
    };
    return '$os · ${Platform.localHostname}';
  }

  Future<void> _submit() async {
    final String code = _code.text.trim();
    if (code.isEmpty) {
      setState(() => _error = 'Informe o código de ativação.');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final DeviceCredential credential = await ref
          .read(deviceCredentialProvider.notifier)
          .pair(code: code, deviceLabel: _deviceLabel);
      if (!mounted) return;
      // Sem `context.go` daqui: o redirect do router reage ao provider e leva
      // para a tela certa sozinho. Navegar à mão duplicaria a regra.
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Terminal ${credential.terminalName} ativado.')),
      );
    } on PdvApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } on SecureStoreUnavailableException {
      // O cofre é conferido **antes** do resgate, então o código digitado
      // continua válido — a mensagem diz isso, para o gerente não sair gerando
      // outro achando que o problema foi o código.
      if (mounted) {
        setState(() => _error = SecureStoreUnavailableException.message);
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool revoked = ref.watch(deviceRevokedProvider);

    return PdvScaffold(
      contentPadding: EdgeInsets.zero,
      appBar: const PdvAppBarChrome(
        // Sem turno e sem terminal: nada de Fechar caixa aqui.
        showCloseShift: false,
        child: SizedBox.shrink(),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: _formMaxWidth),
          child: ListView(
            shrinkWrap: true,
            padding: const EdgeInsets.all(PdvSpacing.xxl),
            children: <Widget>[
              const Icon(
                Icons.point_of_sale,
                size: PdvSizes.iconXl,
                color: PdvColors.info,
              ),
              const SizedBox(height: PdvSpacing.lg),
              Text(
                'Ativar terminal',
                textAlign: TextAlign.center,
                style: PdvTypography.headingLg.copyWith(color: PdvColors.info),
              ),
              const SizedBox(height: PdvSpacing.sm),
              Text(
                'Gere o código de ativação no ERP, em Ponto de venda → '
                'Cadastros, e informe abaixo.',
                textAlign: TextAlign.center,
                style: PdvTypography.bodyMd.copyWith(
                  color: PdvColors.textSecondary,
                ),
              ),
              if (revoked) ...<Widget>[
                const SizedBox(height: PdvSpacing.lg),
                // O operador estava trabalhando e a tela mudou sozinha. Sem
                // esta explicação ele conclui que o app quebrou, e o chamado
                // que chega ao suporte é o errado.
                DecoratedBox(
                  // Sem canto arredondado: o app inteiro é reto, e não há token
                  // de raio (ver `pdv_tokens.dart`).
                  decoration: BoxDecoration(
                    color: PdvColors.surfaceMuted,
                    border: Border.all(color: PdvColors.warning),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(PdvSpacing.lg),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        const Icon(
                          Icons.link_off,
                          size: PdvSizes.iconMd,
                          color: PdvColors.warning,
                        ),
                        const SizedBox(width: PdvSpacing.md),
                        Expanded(
                          child: Text(
                            'O acesso deste terminal foi encerrado pelo '
                            'gerente. Para voltar a operar, peça um código de '
                            'ativação novo.',
                            style: PdvTypography.bodyMd.copyWith(
                              color: PdvColors.textPrimary,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
              const SizedBox(height: PdvSpacing.xxl),
              PdvFilledField(
                label: 'Código de ativação',
                controller: _code,
                autofocus: true,
                enabled: !_submitting,
                errorText: _error,
                helperText: _deviceLabel,
                inputFormatters: <TextInputFormatter>[
                  // Só o alfabeto do código (sem I, O, 0, 1) e maiúsculas: o
                  // operador digita à mão, e minúscula ou espaço colado seriam
                  // recusados pelo servidor sem explicar por quê.
                  FilteringTextInputFormatter.allow(RegExp('[a-zA-Z0-9]')),
                  _UpperCaseFormatter(),
                ],
                onSubmitted: (_) => _submitting ? null : _submit(),
                style: PdvTypography.headingMd.copyWith(
                  color: PdvColors.textPrimary,
                  letterSpacing: 6,
                ),
              ),
              const SizedBox(height: PdvSpacing.xl),
              SizedBox(
                height: PdvSizes.controlHeightLg,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: PdvColors.info,
                    foregroundColor: PdvColors.background,
                  ),
                  onPressed: _submitting ? null : _submit,
                  child:
                      _submitting
                          ? const SizedBox(
                            width: PdvSizes.iconMd,
                            height: PdvSizes.iconMd,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                          : Text('ATIVAR', style: PdvTypography.label),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Largura do formulário. Passar disso deixa o campo de código largo demais
/// para o olho acompanhar 8 caracteres espaçados.
const double _formMaxWidth = 520;

class _UpperCaseFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
    TextEditingValue oldValue,
    TextEditingValue newValue,
  ) {
    return TextEditingValue(
      text: newValue.text.toUpperCase(),
      selection: newValue.selection,
    );
  }
}
