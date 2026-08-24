import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/format/brazilian_masks.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_field.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_section.dart';

/// Seção "Telefones" do formulário de cliente.
class CustomerPhonesSection extends StatelessWidget {
  const CustomerPhonesSection({
    required this.phoneController,
    required this.mobilePhoneController,
    super.key,
  });

  final TextEditingController phoneController;
  final TextEditingController mobilePhoneController;

  @override
  Widget build(BuildContext context) {
    return CustomerFormSectionCard(
      title: 'Telefones',
      child: CustomerFormFieldRow(
        left: CustomerFormField(
          label: 'Telefone comercial',
          controller: phoneController,
          keyboardType: TextInputType.phone,
          inputFormatters: <TextInputFormatter>[phoneMaskFormatter],
        ),
        right: CustomerFormField(
          label: 'Telefone celular',
          controller: mobilePhoneController,
          keyboardType: TextInputType.phone,
          inputFormatters: <TextInputFormatter>[phoneMaskFormatter],
        ),
      ),
    );
  }
}
