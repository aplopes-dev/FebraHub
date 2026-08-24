import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/app/shell/pdv_scaffold.dart';
import 'package:citybox_pdv/core/format/brazilian_masks.dart';
import 'package:citybox_pdv/core/http/pdv_api_client.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/customer/application/customer_catalog_controller.dart';
import 'package:citybox_pdv/features/customer/domain/customer.dart';
import 'package:citybox_pdv/features/customer/domain/customer_address.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';
import 'package:citybox_pdv/features/customer/domain/customer_form_result.dart';
import 'package:citybox_pdv/features/customer/domain/customer_gender.dart';
import 'package:citybox_pdv/features/customer/domain/customer_person_type.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_address_section.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_extra_section.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_app_bar.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_section.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_personal_section.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_phones_section.dart';

/// Tela única de cadastrar e visualizar cliente.
///
/// Cadastro novo persiste em `POST /v1/pos/customers`. Edição de existente é
/// só leitura nesta fatia (sem PUT no device).
class CustomerFormPage extends ConsumerStatefulWidget {
  const CustomerFormPage({this.initial, super.key});

  /// `null` = cadastro novo.
  final Customer? initial;

  @override
  ConsumerState<CustomerFormPage> createState() => _CustomerFormPageState();
}

class _CustomerFormPageState extends ConsumerState<CustomerFormPage> {
  late final TextEditingController _nameController;
  late final TextEditingController _documentController;
  late final TextEditingController _rgController;
  late final TextEditingController _birthDateController;
  late final TextEditingController _emailController;
  late final TextEditingController _phoneController;
  late final TextEditingController _mobilePhoneController;
  late final TextEditingController _zipCodeController;
  late final TextEditingController _streetController;
  late final TextEditingController _numberController;
  late final TextEditingController _complementController;
  late final TextEditingController _districtController;
  late final TextEditingController _stateController;
  late final TextEditingController _cityController;
  late final TextEditingController _notesController;

  late CustomerPersonType _personType;
  late CustomerGender _gender;
  String? _categoryId;
  String? _validationError;
  bool _saving = false;

  bool get _isEditing => widget.initial != null;
  bool get _readOnly => _isEditing;

  @override
  void initState() {
    super.initState();
    final Customer? initial = widget.initial;
    final CustomerAddress address = initial?.address ?? const CustomerAddress();
    final CustomerPersonType personType =
        initial?.personType ?? CustomerPersonType.individual;

    _personType = personType;
    _gender = initial?.gender ?? CustomerGender.unspecified;
    _categoryId = initial?.categoryId;

    _nameController = TextEditingController(text: initial?.name ?? '');
    _documentController = TextEditingController(
      text: formatCpfOrCnpj(
        initial?.document ?? '',
        isCpf: personType == CustomerPersonType.individual,
      ),
    );
    _rgController = TextEditingController(text: initial?.rg ?? '');
    _birthDateController = TextEditingController(
      text: birthDateIsoToDisplay(initial?.birthDate),
    );
    _emailController = TextEditingController(text: initial?.email ?? '');
    _phoneController = TextEditingController(
      text: formatPhone(initial?.phone ?? ''),
    );
    _mobilePhoneController = TextEditingController(
      text: formatPhone(initial?.mobilePhone ?? ''),
    );
    _zipCodeController = TextEditingController(
      text: formatCep(address.zipCode),
    );
    _streetController = TextEditingController(text: address.street);
    _numberController = TextEditingController(text: address.number);
    _complementController = TextEditingController(text: address.complement);
    _districtController = TextEditingController(text: address.district);
    _stateController = TextEditingController(text: address.state);
    _cityController = TextEditingController(text: address.city);
    _notesController = TextEditingController(text: initial?.notes ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _documentController.dispose();
    _rgController.dispose();
    _birthDateController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _mobilePhoneController.dispose();
    _zipCodeController.dispose();
    _streetController.dispose();
    _numberController.dispose();
    _complementController.dispose();
    _districtController.dispose();
    _stateController.dispose();
    _cityController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Customer? _buildDraft() {
    final String name = _nameController.text.trim();
    if (name.isEmpty) {
      setState(() => _validationError = 'Informe o nome do cliente.');
      return null;
    }

    setState(() => _validationError = null);

    final String birthRaw = _birthDateController.text.trim();
    String? birthIso;
    if (_personType == CustomerPersonType.individual && birthRaw.isNotEmpty) {
      birthIso = birthDateDigitsToIso(birthRaw);
      if (birthIso == null) {
        setState(
          () => _validationError =
              'Data de nascimento inválida. Use o formato dd/mm/aaaa.',
        );
        return null;
      }
    }

    return Customer(
      id: widget.initial?.id ?? 'new',
      name: name,
      personType: _personType,
      document: digitsOnly(_documentController.text),
      rg: _rgController.text.trim(),
      birthDate: birthIso,
      email: _emailController.text.trim(),
      gender: _gender,
      phone: digitsOnly(_phoneController.text),
      mobilePhone: digitsOnly(_mobilePhoneController.text),
      address: CustomerAddress(
        zipCode: digitsOnly(_zipCodeController.text),
        street: _streetController.text.trim(),
        number: _numberController.text.trim(),
        complement: _complementController.text.trim(),
        district: _districtController.text.trim(),
        state: _stateController.text.trim().toUpperCase(),
        city: _cityController.text.trim(),
      ),
      categoryId: _categoryId,
      notes: _notesController.text.trim(),
    );
  }

  Future<void> _submit({required bool select}) async {
    if (_readOnly || _saving) {
      return;
    }
    final Customer? draft = _buildDraft();
    if (draft == null) {
      return;
    }

    setState(() {
      _saving = true;
      _validationError = null;
    });

    try {
      final Customer created =
          await ref.read(customerCatalogProvider.notifier).create(draft);
      if (!mounted) {
        return;
      }
      Navigator.of(
        context,
      ).pop(CustomerFormResult(customer: created, select: select));
    } on PdvApiException catch (error) {
      if (!mounted) {
        return;
      }
      setState(() {
        _saving = false;
        _validationError = error.message;
      });
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        _saving = false;
        _validationError =
            'Não foi possível cadastrar o cliente. Tente de novo.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final String? error = _validationError;
    final List<CustomerCategory> categories =
        ref.watch(customerCatalogProvider).categories;

    return PdvScaffold(
      appBar: CustomerFormAppBar(
        isEditing: _isEditing,
        readOnly: _readOnly,
        saving: _saving,
        onBack: () => Navigator.of(context).maybePop(),
        onSave: () => _submit(select: false),
        onSaveAndSelect: () => _submit(select: true),
      ),
      contentPadding: EdgeInsets.zero,
      body: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          if (_readOnly)
            Padding(
              padding: PdvSpacing.contentPadding,
              child: Text(
                'Edição de cliente cadastrado é feita no ERP. Aqui é só consulta.',
                style: PdvTypography.bodyMd.copyWith(
                  color: PdvColors.textSecondary,
                ),
              ),
            ),
          if (error != null)
            Padding(
              padding: PdvSpacing.contentPadding,
              child: Text(
                error,
                style: PdvTypography.bodyMd.copyWith(color: PdvColors.danger),
              ),
            ),
          CustomerFormBody(
            child: AbsorbPointer(
              absorbing: _readOnly || _saving,
              child: CustomerFormSectionGrid(
              primary: CustomerPersonalSection(
                nameController: _nameController,
                documentController: _documentController,
                rgController: _rgController,
                birthDateController: _birthDateController,
                emailController: _emailController,
                personType: _personType,
                gender: _gender,
                categories: categories,
                categoryId: _categoryId,
                onPersonTypeChanged: (CustomerPersonType value) {
                  setState(() {
                    _personType = value;
                    _documentController.text = formatCpfOrCnpj(
                      _documentController.text,
                      isCpf: value == CustomerPersonType.individual,
                    );
                  });
                },
                onGenderChanged: (CustomerGender value) {
                  setState(() => _gender = value);
                },
                onCategoryChanged: (String? value) {
                  setState(() => _categoryId = value);
                },
              ),
              secondary: <Widget>[
                CustomerPhonesSection(
                  phoneController: _phoneController,
                  mobilePhoneController: _mobilePhoneController,
                ),
                CustomerAddressSection(
                  zipCodeController: _zipCodeController,
                  streetController: _streetController,
                  numberController: _numberController,
                  complementController: _complementController,
                  districtController: _districtController,
                  stateController: _stateController,
                  cityController: _cityController,
                ),
                CustomerExtraSection(notesController: _notesController),
              ],
            ),
            ),
          ),
        ],
      ),
    );
  }
}
