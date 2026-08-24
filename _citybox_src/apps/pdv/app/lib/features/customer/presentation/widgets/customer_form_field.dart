import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/ui/pdv_filled_field.dart';

/// Decoração Filled do formulário de cliente — delega ao helper canônico.
InputDecoration customerFilledDecoration(String label) {
  return pdvFilledDecoration(label: label);
}

/// Campo de texto padronizado do formulário de cliente (variante Filled).
class CustomerFormField extends StatelessWidget {
  const CustomerFormField({
    required this.label,
    required this.controller,
    this.keyboardType,
    this.maxLines = 1,
    this.enabled = true,
    this.inputFormatters,
    super.key,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;
  final int maxLines;
  final bool enabled;
  final List<TextInputFormatter>? inputFormatters;

  @override
  Widget build(BuildContext context) {
    return PdvFilledField(
      label: label,
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      enabled: enabled,
      inputFormatters: inputFormatters,
    );
  }
}

/// Dois campos lado a lado numa linha do formulário.
class CustomerFormFieldRow extends StatelessWidget {
  const CustomerFormFieldRow({
    required this.left,
    required this.right,
    this.leftFlex = 1,
    this.rightFlex = 1,
    super.key,
  });

  final Widget left;
  final Widget right;
  final int leftFlex;
  final int rightFlex;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Expanded(flex: leftFlex, child: left),
        const SizedBox(width: PdvSpacing.md),
        Expanded(flex: rightFlex, child: right),
      ],
    );
  }
}
