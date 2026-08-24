import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/format/brazilian_masks.dart';
import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/customer/domain/customer_category.dart';
import 'package:citybox_pdv/features/customer/domain/customer_gender.dart';
import 'package:citybox_pdv/features/customer/domain/customer_person_type.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_field.dart';
import 'package:citybox_pdv/features/customer/presentation/widgets/customer_form_section.dart';

/// Seção "Dados pessoais" do formulário de cliente.
class CustomerPersonalSection extends StatelessWidget {
  const CustomerPersonalSection({
    required this.nameController,
    required this.documentController,
    required this.rgController,
    required this.birthDateController,
    required this.emailController,
    required this.personType,
    required this.gender,
    required this.categories,
    required this.categoryId,
    required this.onPersonTypeChanged,
    required this.onGenderChanged,
    required this.onCategoryChanged,
    super.key,
  });

  final TextEditingController nameController;
  final TextEditingController documentController;
  final TextEditingController rgController;
  final TextEditingController birthDateController;
  final TextEditingController emailController;
  final CustomerPersonType personType;
  final CustomerGender gender;
  final List<CustomerCategory> categories;
  final String? categoryId;
  final ValueChanged<CustomerPersonType> onPersonTypeChanged;
  final ValueChanged<CustomerGender> onGenderChanged;
  final ValueChanged<String?> onCategoryChanged;

  @override
  Widget build(BuildContext context) {
    final bool isIndividual = personType == CustomerPersonType.individual;

    return CustomerFormSectionCard(
      title: 'Dados pessoais',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          CustomerFormField(label: 'Nome', controller: nameController),
          const SizedBox(height: PdvSpacing.md),
          CustomerFormFieldRow(
            left: DropdownButtonFormField<CustomerPersonType>(
              key: ValueKey<CustomerPersonType>(personType),
              initialValue: personType,
              isExpanded: true,
              decoration: customerFilledDecoration('Tipo de cliente'),
              items: CustomerPersonType.values
                  .map(
                    (CustomerPersonType type) =>
                        DropdownMenuItem<CustomerPersonType>(
                          value: type,
                          child: Text(
                            type.label,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                  )
                  .toList(growable: false),
              onChanged: (CustomerPersonType? value) {
                if (value != null) {
                  onPersonTypeChanged(value);
                }
              },
            ),
            right: CustomerFormField(
              label: personType.documentFieldLabel,
              controller: documentController,
              keyboardType: TextInputType.number,
              inputFormatters: <TextInputFormatter>[
                isIndividual ? cpfMaskFormatter : cnpjMaskFormatter,
              ],
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          CustomerFormFieldRow(
            left: CustomerFormField(
              label: 'Data de nascimento',
              controller: birthDateController,
              enabled: isIndividual,
              keyboardType: TextInputType.number,
              inputFormatters: <TextInputFormatter>[birthDateMaskFormatter],
            ),
            right: CustomerFormField(
              label: 'Documento (RG)',
              controller: rgController,
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          CustomerFormFieldRow(
            left: CustomerFormField(
              label: 'E-mail',
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
            ),
            right: DropdownButtonFormField<CustomerGender>(
              key: ValueKey<CustomerGender>(gender),
              initialValue: gender,
              isExpanded: true,
              decoration: customerFilledDecoration('Gênero'),
              items: CustomerGender.values
                  .map(
                    (CustomerGender value) => DropdownMenuItem<CustomerGender>(
                      value: value,
                      child: Text(value.label, overflow: TextOverflow.ellipsis),
                    ),
                  )
                  .toList(growable: false),
              onChanged: (CustomerGender? value) {
                if (value != null) {
                  onGenderChanged(value);
                }
              },
            ),
          ),
          const SizedBox(height: PdvSpacing.md),
          DropdownButtonFormField<String?>(
            key: ValueKey<String?>(categoryId),
            initialValue:
                categories.any((CustomerCategory c) => c.id == categoryId)
                    ? categoryId
                    : null,
            isExpanded: true,
            decoration: customerFilledDecoration('Categoria'),
            items: <DropdownMenuItem<String?>>[
              const DropdownMenuItem<String?>(
                value: null,
                child: Text('Sem categoria', overflow: TextOverflow.ellipsis),
              ),
              ...categories.map(
                (CustomerCategory category) => DropdownMenuItem<String?>(
                  value: category.id,
                  child: Text(category.name, overflow: TextOverflow.ellipsis),
                ),
              ),
            ],
            onChanged: onCategoryChanged,
          ),
        ],
      ),
    );
  }
}
