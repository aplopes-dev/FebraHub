import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Seção de formulário desktop: título, descrição opcional e campos.
class PdvFormSection extends StatelessWidget {
  const PdvFormSection({
    required this.title,
    required this.children,
    this.description,
    this.gap = PdvSpacing.md,
    super.key,
  });

  final String title;
  final String? description;
  final List<Widget> children;
  final double gap;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: <Widget>[
        Text(title, style: PdvTypography.headingMd),
        if (description != null) ...<Widget>[
          const SizedBox(height: PdvSpacing.sm),
          Text(
            description!,
            style: PdvTypography.bodySm.copyWith(
              color: PdvColors.textSecondary,
            ),
          ),
        ],
        SizedBox(height: gap),
        for (int i = 0; i < children.length; i++) ...<Widget>[
          if (i > 0) SizedBox(height: gap),
          children[i],
        ],
      ],
    );
  }
}

/// Centraliza conteúdo de formulário com largura máxima desktop.
class PdvFormFrame extends StatelessWidget {
  const PdvFormFrame({
    required this.child,
    this.maxWidth = PdvSizes.formMaxWidth,
    this.padding = const EdgeInsets.all(PdvSpacing.xl),
    super.key,
  });

  final Widget child;
  final double maxWidth;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: Padding(padding: padding, child: child),
      ),
    );
  }
}

/// Card de KPI / métrica do hub de caixa.
class PdvStatCard extends StatelessWidget {
  const PdvStatCard({
    required this.label,
    required this.value,
    this.emphasized = false,
    super.key,
  });

  final String label;
  final String value;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: emphasized ? PdvColors.brandSurface : PdvColors.surface,
        border: Border.all(color: PdvColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(PdvSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              label,
              style: PdvTypography.bodySm.copyWith(
                color: PdvColors.textSecondary,
              ),
            ),
            const SizedBox(height: PdvSpacing.sm),
            Text(
              value,
              style: (emphasized
                      ? PdvTypography.amountLg
                      : PdvTypography.headingSm)
                  .copyWith(
                    color: PdvColors.textPrimary,
                    fontFeatures: PdvTypography.tabular,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
