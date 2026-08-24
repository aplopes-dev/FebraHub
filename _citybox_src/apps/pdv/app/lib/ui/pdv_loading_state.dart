import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Estado de carregamento compartilhado.
class PdvLoadingState extends StatelessWidget {
  const PdvLoadingState({this.message, super.key});

  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const SizedBox(
            width: 32,
            height: 32,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
          if (message != null) ...<Widget>[
            const SizedBox(height: PdvSpacing.md),
            Text(message!, style: PdvTypography.bodyMd),
          ],
        ],
      ),
    );
  }
}
