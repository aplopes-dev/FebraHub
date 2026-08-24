import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/format/brazilian_masks.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/customer/data/pos_cep_api.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_field.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_section.dart';
import 'package:citybox_pdv/features/terminal/application/device_credential_controller.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

final Provider<PosCepApi> posCepApiProvider = Provider<PosCepApi>(
  (Ref ref) => PosCepApi(ref.watch(pdvApiClientProvider)),
);

/// Seção "Endereço" do formulário de cliente — lookup de CEP via erp-api.
class CustomerAddressSection extends ConsumerStatefulWidget {
  const CustomerAddressSection({
    required this.zipCodeController,
    required this.streetController,
    required this.numberController,
    required this.complementController,
    required this.districtController,
    required this.stateController,
    required this.cityController,
    this.enabled = true,
    super.key,
  });

  final TextEditingController zipCodeController;
  final TextEditingController streetController;
  final TextEditingController numberController;
  final TextEditingController complementController;
  final TextEditingController districtController;
  final TextEditingController stateController;
  final TextEditingController cityController;
  final bool enabled;

  @override
  ConsumerState<CustomerAddressSection> createState() =>
      _CustomerAddressSectionState();
}

class _CustomerAddressSectionState
    extends ConsumerState<CustomerAddressSection> {
  static const Duration _debounce = Duration(milliseconds: 400);

  Timer? _debounceTimer;
  int _requestId = 0;
  bool _lookingUp = false;
  bool _userEditedZip = false;
  String? _cepFeedback;

  @override
  void initState() {
    super.initState();
    widget.zipCodeController.addListener(_onZipChanged);
  }

  @override
  void dispose() {
    widget.zipCodeController.removeListener(_onZipChanged);
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onZipChanged() {
    if (!_userEditedZip || !widget.enabled) return;

    final String digits = digitsOnly(widget.zipCodeController.text);
    if (digits.length != 8) {
      if (_cepFeedback != null) {
        setState(() => _cepFeedback = null);
      }
      return;
    }

    _debounceTimer?.cancel();
    _debounceTimer = Timer(_debounce, () => unawaited(_lookup(digits)));
  }

  Future<void> _lookup(String digits) async {
    final int requestId = ++_requestId;
    setState(() {
      _lookingUp = true;
      _cepFeedback = null;
    });

    try {
      final PosCepAddress address = await ref
          .read(posCepApiProvider)
          .lookup(digits);
      if (!mounted || requestId != _requestId) return;

      widget.streetController.text = address.street;
      widget.districtController.text = address.neighborhood;
      widget.cityController.text = address.city;
      widget.stateController.text = address.state;
      setState(() {
        _lookingUp = false;
        _cepFeedback = null;
      });
    } on PdvApiException catch (error) {
      if (!mounted || requestId != _requestId) return;
      final String message = error.isOffline
          ? 'Sem conexão. Preencha o endereço manualmente.'
          : (error.message.trim().isEmpty
                ? 'Não foi possível buscar o CEP. Preencha o endereço manualmente.'
                : error.message);
      setState(() {
        _lookingUp = false;
        _cepFeedback = message;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } catch (_) {
      if (!mounted || requestId != _requestId) return;
      const String message =
          'Não foi possível buscar o CEP. Preencha o endereço manualmente.';
      setState(() {
        _lookingUp = false;
        _cepFeedback = message;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(message)),
      );
    }
  }

  bool get _fieldsEnabled => widget.enabled && !_lookingUp;

  @override
  Widget build(BuildContext context) {
    return CustomerFormSectionCard(
      title: 'Endereço',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          if (_lookingUp)
            const Padding(
              padding: EdgeInsets.only(bottom: PdvSpacing.sm),
              child: LinearProgressIndicator(minHeight: 2),
            ),
          CustomerFormFieldRow(
            leftFlex: 1,
            rightFlex: 2,
            left: PdvFilledField(
              label: 'CEP',
              controller: widget.zipCodeController,
              enabled: widget.enabled && !_lookingUp,
              keyboardType: TextInputType.number,
              inputFormatters: <TextInputFormatter>[cepMaskFormatter],
              errorText: _cepFeedback,
              suffixIcon: _lookingUp
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : null,
              onChanged: (_) {
                if (!_userEditedZip) {
                  setState(() => _userEditedZip = true);
                }
              },
            ),
            right: CustomerFormField(
              label: 'Logradouro',
              controller: widget.streetController,
              enabled: _fieldsEnabled,
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          CustomerFormFieldRow(
            leftFlex: 1,
            rightFlex: 2,
            left: CustomerFormField(
              label: 'Número',
              controller: widget.numberController,
              enabled: _fieldsEnabled,
            ),
            right: CustomerFormField(
              label: 'Complemento',
              controller: widget.complementController,
              enabled: _fieldsEnabled,
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          CustomerFormFieldRow(
            leftFlex: 2,
            rightFlex: 1,
            left: CustomerFormField(
              label: 'Bairro',
              controller: widget.districtController,
              enabled: _fieldsEnabled,
            ),
            right: CustomerFormField(
              label: 'Estado',
              controller: widget.stateController,
              enabled: _fieldsEnabled,
              inputFormatters: <TextInputFormatter>[
                LengthLimitingTextInputFormatter(2),
                FilteringTextInputFormatter.allow(RegExp(r'[a-zA-Z]')),
              ],
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          CustomerFormField(
            label: 'Cidade',
            controller: widget.cityController,
            enabled: _fieldsEnabled,
          ),
        ],
      ),
    );
  }
}
