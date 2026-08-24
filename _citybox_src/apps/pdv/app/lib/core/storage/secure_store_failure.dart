import 'dart:async';

import 'package:flutter/services.dart';

/// O cofre do sistema não está disponível neste computador.
///
/// Acontece de verdade: em Linux sem sessão gráfica completa — WSL2, servidor
/// headless, container — não há `org.freedesktop.secrets`, e o
/// `flutter_secure_storage` levanta `PlatformException`. Em Android e Windows é
/// raro, mas um perfil corrompido produz o mesmo efeito.
///
/// **Não existe plano B.** O que mora no cofre é credencial: o token do
/// terminal e os hashes de PIN da equipe. Cair para `SharedPreferences` seria
/// gravar isso em texto claro — trocar uma falha visível por um vazamento
/// silencioso. Então o app diz o que aconteceu e para.
class SecureStoreUnavailableException implements Exception {
  const SecureStoreUnavailableException(this.detail);

  /// Mensagem original da plataforma — vai para o log, não para a tela.
  final String detail;

  /// O que o operador lê. Diz o que fazer, e a quem recorrer: instalar chaveiro
  /// não é tarefa de quem está no caixa.
  static const String message =
      'O cofre de credenciais deste computador não está disponível, e sem ele '
      'o terminal não pode guardar a ativação com segurança. '
      'O código continua válido — chame o suporte técnico.';

  @override
  String toString() => message;
}

/// Fila global de acesso ao cofre.
///
/// No Linux o `flutter_secure_storage` guarda **todas** as chaves num único
/// item do libsecret e cada `write`/`delete` faz read-modify-write desse JSON.
/// O boot do PDV dispara várias hidratações em paralelo (credencial, alçada,
/// cache de operadores, tentativas). Sem esta fila, duas gravações concorrentes
/// leem o mesmo snapshot e a segunda sobrescreve a primeira — a credencial do
/// terminal some do chaveiro, o ERP continua "pareado" e o app pede o código
/// de ativação de novo.
///
/// Visível para testes (`test/unit/vault_gate_test.dart`). Em produção só entra
/// via [readFromVault] / [writeToVault].
Future<T> runInVault<T>(Future<T> Function() operation) {
  final Completer<T> result = Completer<T>();
  _vaultChain = _vaultChain
      .catchError((Object _) {})
      .then((_) => operation())
      .then(result.complete, onError: result.completeError);
  return result.future;
}

/// Encadeia as operações; erros individuais não podem romper a fila.
Future<void> _vaultChain = Future<void>.value();

/// Só para testes — não usar no app.
void debugResetVaultGate() {
  _vaultChain = Future<void>.value();
}

/// Executa uma leitura do cofre tratando indisponibilidade como **ausência**.
///
/// Ler é o caminho de boot, e ali a falha tem uma resposta segura: sem
/// credencial o app cai na ativação, sem alçada vale a restritiva, sem cache
/// não há login offline. Todas erram para o lado de exigir mais, não menos —
/// por isso engolir aqui é aceitável, e devolver `null` é honesto.
/// Quanto tempo esperar o cofre antes de desistir.
///
/// Ler uma chave local leva milissegundos. Cinco segundos não é margem para
/// lentidão — é o limite entre "está respondendo" e "não vai responder".
///
/// ⚠️ **O caso que obrigou a existir**: um chaveiro com senha faz o
/// `gnome-keyring` abrir um diálogo de desbloqueio, e a chamada fica pendente
/// **sem lançar nada** até alguém digitar. Num terminal de loja não há ninguém
/// para digitar; num WSL sem GPU o diálogo nem desenha. O app ficava parado
/// para sempre na tela de abertura — indistinguível de travado.
const Duration vaultTimeout = Duration(seconds: 5);

Future<T?> readFromVault<T>(Future<T?> Function() read) {
  return runInVault(() async {
    try {
      return await read().timeout(vaultTimeout);
    } on PlatformException {
      return null;
    } on MissingPluginException {
      // Plataforma sem a implementação nativa registrada.
      return null;
    } on TimeoutException {
      // Mesma resposta de cofre ausente: "não existe". Erra para o lado seguro —
      // cai na ativação, na alçada restritiva, sem login offline.
      return null;
    }
  });
}

/// Executa uma escrita no cofre traduzindo indisponibilidade em
/// [SecureStoreUnavailableException].
///
/// Escrever **não** pode ser silencioso onde o resultado importa: o pareamento
/// consome um código de uso único, e um "ativado" que não persiste faria o
/// gerente gerar código atrás de código sem entender por quê.
Future<void> writeToVault(Future<void> Function() write) {
  return runInVault(() async {
    try {
      await write().timeout(vaultTimeout);
    } on PlatformException catch (error) {
      throw SecureStoreUnavailableException(error.message ?? '$error');
    } on MissingPluginException catch (error) {
      throw SecureStoreUnavailableException('$error');
    } on TimeoutException {
      throw const SecureStoreUnavailableException(
        'o cofre não respondeu (provável diálogo de desbloqueio pendente)',
      );
    }
  });
}
