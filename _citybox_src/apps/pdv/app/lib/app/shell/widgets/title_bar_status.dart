import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:citybox_pdv/core/theme/pdv_tokens.dart';
import 'package:citybox_pdv/features/shared/application/shell_providers.dart';
import 'package:citybox_pdv/features/shared/domain/sync_status.dart';

/// Saúde dos canais de venda — o bloco direito da barra.
///
/// Dois indicadores, com respiro entre eles: são lidos de relance, no meio de
/// um atendimento, e ícones colados viram uma mancha só.
class TitleBarStatus extends ConsumerWidget {
  const TitleBarStatus({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final SyncStatus status = ref.watch(syncStatusProvider);
    // O relógio da barra já existe e tica de segundo em segundo — reaproveitá-lo
    // faz o aviso de "vence em menos de um dia" aparecer sozinho, sem ninguém
    // precisar recarregar a tela. `valueOrNull` cobre o primeiro frame.
    final DateTime now = ref.watch(clockProvider).valueOrNull ?? DateTime.now();
    final ChannelHealth? offlineHealth = _offlineHealth(status, now);

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        _ChannelDot(
          health: status.network,
          icon: Icons.cloud_outlined,
          label: 'Conexão com o servidor',
          okDetail: 'Online',
          degradedDetail: 'Conexão instável',
          downDetail: 'Sem conexão — vendas ficam no terminal',
        ),
        const SizedBox(width: PdvSpacing.lg),
        _ChannelDot(
          health: status.fiscal,
          icon: Icons.receipt_long_outlined,
          label: 'Sefaz (NFC-e / SAT / MFE)',
          okDetail: 'Autorizando normalmente',
          degradedDetail: 'NF configurada · emissão ainda não no PDV',
          downDetail: 'Fiscal não configurado',
        ),
        // Só aparece quando há algo a dizer. Um indicador permanente de "cache
        // ok" ocuparia espaço da barra o dia inteiro para informar o normal.
        if (offlineHealth != null) ...<Widget>[
          const SizedBox(width: PdvSpacing.lg),
          _ChannelDot(
            health: offlineHealth,
            icon: Icons.no_encryption_gmailerrorred_outlined,
            label: 'Entrada sem rede',
            okDetail: 'Disponível',
            degradedDetail:
                'Vence em menos de um dia — conecte à rede da loja para '
                'renovar',
            downDetail:
                'Indisponível — sem rede, ninguém consegue entrar neste '
                'terminal',
          ),
        ],
      ],
    );
  }

  /// `null` = não há nada a avisar sobre o login offline.
  ///
  /// Deliberadamente independente de `network`: o cache pode estar vencendo com
  /// o terminal online, e é justamente essa a hora de avisar — quando ainda dá
  /// para resolver sozinho.
  static ChannelHealth? _offlineHealth(SyncStatus status, DateTime now) {
    if (status.offlineCacheExpiresAt == null) {
      // Nunca sincronizou. Só vira aviso quando a rede já caiu — antes disso é
      // um problema hipotético, e alarme hipotético vira ruído.
      return status.network == ChannelHealth.ok ? null : ChannelHealth.down;
    }
    if (status.offlineCacheExpired(now)) return ChannelHealth.down;
    if (status.offlineCacheExpiringSoon(now)) return ChannelHealth.degraded;
    return null;
  }
}

/// Indicador de um canal.
///
/// Cor **e** ícone, nunca cor sozinha: cerca de 8% dos homens têm alguma
/// deficiência de visão de cores, e verde/vermelho é exatamente o par que eles
/// não distinguem. O tooltip completa, dizendo o que fazer a respeito.
class _ChannelDot extends StatelessWidget {
  const _ChannelDot({
    required this.health,
    required this.icon,
    required this.label,
    required this.okDetail,
    required this.degradedDetail,
    required this.downDetail,
  });

  final ChannelHealth health;
  final IconData icon;
  final String label;
  final String okDetail;
  final String degradedDetail;
  final String downDetail;

  @override
  Widget build(BuildContext context) {
    final (Color color, IconData badge, String detail) = switch (health) {
      ChannelHealth.ok => (
        PdvTitleBarColors.success,
        Icons.check_circle,
        okDetail,
      ),
      ChannelHealth.degraded => (
        PdvTitleBarColors.warning,
        Icons.error,
        degradedDetail,
      ),
      ChannelHealth.down => (
        PdvTitleBarColors.danger,
        Icons.cancel,
        downDetail,
      ),
    };

    return Tooltip(
      message: '$label\n$detail',
      child: Semantics(
        label: '$label: $detail',
        child: SizedBox(
          width: 26,
          height: 20,
          child: Stack(
            clipBehavior: Clip.none,
            children: <Widget>[
              Positioned(
                left: 0,
                top: 2,
                child: Icon(icon, size: PdvSizes.iconSm, color: color),
              ),
              // O selo sobrepõe o canto do ícone — quem já sabe o que a barra
              // mostra lê só a cor; quem não sabe, abre o tooltip.
              Positioned(
                right: 0,
                bottom: 0,
                child: Icon(badge, size: 10, color: color),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
