import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Estado vazio compartilhado.
class PdvEmptyState extends StatelessWidget {
  const PdvEmptyState({
    required this.title,
    this.subtitle,
    this.icon = Icons.inbox_outlined,
    super.key,
  });

  final String title;
  final String? subtitle;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(PdvSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            Icon(icon, size: PdvSizes.iconLg, color: PdvColors.textSecondary),
            const SizedBox(height: PdvSpacing.md),
            Text(
              title,
              style: PdvTypography.headingSm,
              textAlign: TextAlign.center,
            ),
            if (subtitle != null) ...<Widget>[
              const SizedBox(height: PdvSpacing.sm),
              Text(
                subtitle!,
                style: PdvTypography.bodyMd.copyWith(
                  color: PdvColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
