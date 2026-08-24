import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Se o terminal conseguiu falar com o servidor na última tentativa.
///
/// **Não é `connectivity_plus`, e a diferença importa.** Ter Wi-Fi não é ter
/// servidor: o roteador da loja pode estar de pé com o link caído, ou o
/// `erp-api` fora do ar. O que o caixa precisa saber é se a *loja* responde, e
/// a única fonte honesta disso é o resultado das requisições que o app já faz.
///
/// Começa em `true` — otimista de propósito. Antes da primeira chamada não há
/// informação, e piscar "sem conexão" num terminal saudável a cada boot ensina
/// o operador a ignorar o indicador. O primeiro `sync` do boot corrige em
/// segundos se estiver mesmo offline.
final NotifierProvider<TerminalOnlineController, bool> terminalOnlineProvider =
    NotifierProvider<TerminalOnlineController, bool>(
      TerminalOnlineController.new,
    );

class TerminalOnlineController extends Notifier<bool> {
  @override
  bool build() => true;

  /// Chamado por quem fala com a API, com o resultado da tentativa.
  void report({required bool online}) {
    if (state != online) state = online;
  }
}
