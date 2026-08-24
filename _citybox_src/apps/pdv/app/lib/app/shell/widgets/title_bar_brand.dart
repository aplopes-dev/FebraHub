import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';

/// Logo, nome do app, data/hora e versão — o bloco esquerdo da barra.
class TitleBarBrand extends StatelessWidget {
  const TitleBarBrand({super.key});

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _BrandMark(),
        SizedBox(width: PdvSpacing.lg),
        _ClockBlock(),
        SizedBox(width: PdvSpacing.md),
        _VersionLabel(),
      ],
    );
  }
}

class _BrandMark extends StatelessWidget {
  const _BrandMark();

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        // O Flutter escolhe sozinho entre logobrand.png, @2x/ e @3x/ conforme a
        // densidade da tela. A fonte é o SVG ao lado — ver `tool/build_logo.py`.
        const Image(
          image: AssetImage('assets/images/logobrand.png'),
          width: 20,
          height: 20,
          filterQuality: FilterQuality.medium,
        ),
        const SizedBox(width: PdvSpacing.sm),
        Text(
          'Citybox PDV',
          style: PdvTypography.labelSm.copyWith(
            color: PdvTitleBarColors.foreground,
          ),
        ),
      ],
    );
  }
}

/// Data em cima, hora embaixo.
///
/// A hora é o único dado da barra que muda a cada segundo. Isolá-la num widget
/// próprio faz o rebuild parar aqui, em vez de repintar a barra inteira 60
/// vezes por minuto.
class _ClockBlock extends ConsumerWidget {
  const _ClockBlock();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // O primeiro tick do stream só chega em 1 s; até lá, o horário atual evita
    // a barra abrir vazia.
    final DateTime now = ref.watch(clockProvider).value ?? DateTime.now();

    return Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          DateFormat('dd/MM/yyyy', 'pt_BR').format(now),
          style: PdvTypography.caption.copyWith(
            color: PdvTitleBarColors.foregroundMuted,
            fontFeatures: PdvTypography.tabular,
          ),
        ),
        Text(
          DateFormat('HH:mm:ss', 'pt_BR').format(now),
          style: PdvTypography.labelSm.copyWith(
            color: PdvTitleBarColors.foreground,
            // Sem dígitos de largura fixa, o relógio treme na horizontal a cada
            // segundo — e a barra inteira parece instável.
            fontFeatures: PdvTypography.tabular,
          ),
        ),
      ],
    );
  }
}

class _VersionLabel extends ConsumerWidget {
  const _VersionLabel();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Enquanto o plugin não responde, fica vazio em vez de "carregando": versão
    // é informação de suporte, não vale piscar na barra a cada abertura.
    final String version = ref.watch(appVersionProvider).value ?? '';

    return Text(
      version,
      style: PdvTypography.caption.copyWith(
        color: PdvTitleBarColors.foregroundSubtle,
      ),
    );
  }
}
