import 'package:flutter/material.dart';

import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_field.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_section.dart';

/// Seção "Observação" do formulário de cliente.
class CustomerExtraSection extends StatelessWidget {
  const CustomerExtraSection({required this.notesController, super.key});

  final TextEditingController notesController;

  @override
  Widget build(BuildContext context) {
    return CustomerFormSectionCard(
      title: 'Observação',
      child: CustomerFormField(
        label: 'Observação',
        controller: notesController,
        maxLines: 3,
      ),
    );
  }
}
