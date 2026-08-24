import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/payment/application/payment_draft_controller.dart';

/// Escolha da bandeira, para as formas que pedem uma (crédito e débito).
///
/// Ocupa o lugar do teclado numérico enquanto nenhuma bandeira foi escolhida:
/// é uma etapa **antes** do valor, não ao lado dele — digitar R$ 84,90 e só
/// depois descobrir que faltava dizer "MasterCard" é retrabalho garantido.
class PaymentBrandPicker extends ConsumerWidget {
  const PaymentBrandPicker({required this.brands, super.key});

  final List<String> brands;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Padding(
          padding: const EdgeInsets.only(bottom: PdvSpacing.md),
          child: Text(
            'Escolha a bandeira',
            style: PdvTypography.label.copyWith(
              color: PdvCounterColors.foregroundMuted,
            ),
          ),
        ),
        for (final String brand in brands) ...<Widget>[
          _BrandTile(
            label: brand,
            onPressed:
                () =>
                    ref.read(paymentDraftProvider.notifier).selectBrand(brand),
          ),
          const SizedBox(height: PdvSpacing.sm),
        ],
      ],
    );
  }
}

class _BrandTile extends StatelessWidget {
  const _BrandTile({required this.label, required this.onPressed});

  final String label;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: PdvSizes.controlHeight,
      child: Material(
        color: PdvCounterColors.surfaceStrong,
        child: InkWell(
          onTap: onPressed,
          hoverColor: PdvCounterColors.surfaceHover,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: PdvSpacing.md),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                label,
                style: PdvTypography.bodyMd.copyWith(
                  color: PdvCounterColors.foreground,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Trilha do que já foi escolhido nesta forma de pagamento: contrato,
/// bandeira e valor.
///
/// Só aparece nas formas com bandeira — nas demais não há etapa nenhuma a
/// acompanhar, e a trilha seria uma linha decorativa.
class PaymentStepTrail extends StatelessWidget {
  const PaymentStepTrail({
    required this.brand,
    required this.hasAmount,
    super.key,
  });

  final String? brand;
  final bool hasAmount;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: PdvSpacing.md),
      child: Row(
        children: <Widget>[
          // Contrato é sempre o da loja — nada a escolher, então nasce
          // cumprido. Existe na trilha para o operador reconhecer as mesmas
          // três etapas do PDV que ele já usava.
          const Expanded(child: _Step(label: 'Contrato', done: true)),
          Expanded(
            child: _Step(label: 'Bandeira', value: brand, done: brand != null),
          ),
          Expanded(child: _Step(label: 'Valor', done: hasAmount)),
        ],
      ),
    );
  }
}

class _Step extends StatelessWidget {
  const _Step({required this.label, required this.done, this.value});

  final String label;
  final bool done;
  final String? value;

  @override
  Widget build(BuildContext context) {
    final String? valueText = value;
    final Color color =
        done ? PdvCounterColors.accentMuted : PdvCounterColors.foregroundMuted;

    return Row(
      children: <Widget>[
        Icon(
          done ? Icons.check_circle : Icons.circle_outlined,
          size: PdvSizes.iconSm,
          color: color,
        ),
        const SizedBox(width: PdvSpacing.xs),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Text(
                label,
                style: PdvTypography.labelSm.copyWith(color: color),
                overflow: TextOverflow.ellipsis,
              ),
              if (valueText != null)
                Text(
                  valueText,
                  style: PdvTypography.caption.copyWith(
                    color: PdvCounterColors.foregroundMuted,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
      ],
    );
  }
}
