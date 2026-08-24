import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Estado de erro compartilhado, com ação opcional.
class PdvErrorState extends StatelessWidget {
  const PdvErrorState({
    required this.message,
    this.onRetry,
    this.retryLabel = 'Tentar de novo',
    super.key,
  });

  final String message;
  final VoidCallback? onRetry;
  final String retryLabel;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(PdvSpacing.lg),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(
              Icons.error_outline,
              size: PdvSizes.iconLg,
              color: PdvColors.danger,
            ),
            const SizedBox(height: PdvSpacing.md),
            Text(
              message,
              style: PdvTypography.bodyMd,
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...<Widget>[
              const SizedBox(height: PdvSpacing.lg),
              TextButton(onPressed: onRetry, child: Text(retryLabel)),
            ],
          ],
        ),
      ),
    );
  }
}
