import 'package:flutter/material.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';

/// Tamanho canônico de diálogo desktop do PDV.
enum PdvDialogSize {
  /// Formulários curtos (abrir/fechar caixa, ajuste, observação).
  medium,

  /// Listas com busca (vendedor, cliente).
  large,
}

/// Corpo padronizado de diálogo: largura fixa, padding e tipografia do tema.
///
/// Use dentro de [AlertDialog.content] ou como filho de [Dialog].
class PdvDialogBody extends StatelessWidget {
  const PdvDialogBody({
    required this.child,
    this.size = PdvDialogSize.medium,
    this.height,
    this.padding,
    super.key,
  });

  final Widget child;
  final PdvDialogSize size;

  /// Altura fixa (listas). `null` deixa o conteúdo definir a altura.
  final double? height;
  final EdgeInsetsGeometry? padding;

  double get _width => switch (size) {
    PdvDialogSize.medium => PdvSizes.dialogMdWidth,
    PdvDialogSize.large => PdvSizes.dialogLgWidth,
  };

  @override
  Widget build(BuildContext context) {
    return ConstrainedBox(
      constraints: BoxConstraints(
        maxWidth: _width,
        maxHeight: height ?? double.infinity,
        minWidth: 0,
      ),
      child: SizedBox(
        width: _width,
        height: height,
        child:
            padding == null ? child : Padding(padding: padding!, child: child),
      ),
    );
  }
}

/// Ações de diálogo com botões na altura padrão do PDV.
class PdvDialogActions extends StatelessWidget {
  const PdvDialogActions({required this.children, super.key});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: PdvSpacing.sm),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: <Widget>[
          for (int i = 0; i < children.length; i++) ...<Widget>[
            if (i > 0) const SizedBox(width: PdvSpacing.sm),
            children[i],
          ],
        ],
      ),
    );
  }
}
