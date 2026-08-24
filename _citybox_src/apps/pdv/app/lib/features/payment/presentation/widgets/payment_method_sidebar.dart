import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/payment/application/payment_draft_controller.dart';
import 'package:citybox_pdv/features/payment/application/payment_methods_controller.dart';
import 'package:citybox_pdv/features/payment/domain/payment_method.dart';

/// Coluna das formas de pagamento.
///
/// Mesma anatomia da coluna de categorias do Balcão — fundo próprio, uma
/// entrada por linha, a selecionada em cor cheia — de propósito: são as duas
/// colunas de escolha do app, e o operador aprende uma só vez.
class PaymentMethodSidebar extends ConsumerWidget {
  const PaymentMethodSidebar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final PaymentDraft draft = ref.watch(paymentDraftProvider);
    final List<PaymentMethod> methods =
        ref.watch(paymentMethodsProvider).methods;

    return ColoredBox(
      color: PdvCounterColors.categorySurface,
      child: ListView(
        padding: EdgeInsets.zero,
        children: <Widget>[
          for (final PaymentMethod method in methods)
            _MethodTile(
              method: method,
              selected: method.id == draft.method.id,
              onTap:
                  () => ref
                      .read(paymentDraftProvider.notifier)
                      .selectMethod(method),
            ),
        ],
      ),
    );
  }
}

class _MethodTile extends StatelessWidget {
  const _MethodTile({
    required this.method,
    required this.selected,
    required this.onTap,
  });

  final PaymentMethod method;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: PdvCounterColors.border)),
      ),
      child: Material(
        color: selected ? PdvCounterColors.accent : Colors.transparent,
        child: InkWell(
          onTap: onTap,
          hoverColor: PdvCounterColors.surfaceHover,
          child: SizedBox(
            height: PdvSizes.controlHeight,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.lg),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  method.label,
                  style: PdvTypography.label.copyWith(
                    color:
                        selected
                            ? PdvColors.onBrand
                            : PdvCounterColors.accentMuted,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
