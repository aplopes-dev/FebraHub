import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Cartão de seção do formulário: fundo paper + título + conteúdo.
class CustomerFormSectionCard extends StatelessWidget {
  const CustomerFormSectionCard({
    required this.title,
    required this.child,
    super.key,
  });

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: PdvColors.surface,
      child: Padding(
        padding: const EdgeInsets.all(PdvSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Text(
              title,
              style: PdvTypography.label.copyWith(
                color: PdvColors.textSecondary,
              ),
            ),
            const SizedBox(height: PdvSpacing.md),
            child,
          ],
        ),
      ),
    );
  }
}

/// Container externo do formulário: afasta o bloco de seções das bordas da
/// área útil (padrão `contentPadding` do scaffold).
class CustomerFormBody extends StatelessWidget {
  const CustomerFormBody({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Padding(padding: PdvSpacing.contentPadding, child: child);
  }
}

/// Layout das seções do formulário: **Dados pessoais** sozinho à esquerda;
/// as demais empilhadas à direita.
class CustomerFormSectionGrid extends StatelessWidget {
  const CustomerFormSectionGrid({
    required this.primary,
    required this.secondary,
    super.key,
  });

  /// Seção larga da esquerda (dados pessoais).
  final Widget primary;

  /// Seções empilhadas da direita (telefones, endereço, extra).
  final List<Widget> secondary;

  @override
  Widget build(BuildContext context) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: <Widget>[
          Expanded(child: primary),
          const SizedBox(width: PdvSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: <Widget>[
                for (int i = 0; i < secondary.length; i++) ...<Widget>[
                  if (i > 0) const SizedBox(height: PdvSpacing.md),
                  secondary[i],
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
