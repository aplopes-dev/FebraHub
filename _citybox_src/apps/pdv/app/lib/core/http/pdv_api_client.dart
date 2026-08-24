import 'package:dio/dio.dart';

/// Cliente HTTP do PDV contra a `erp-api`.
///
/// Três decisões que não são estilo:
///
/// 1. **A URL base vem de `--dart-define`**, não de constante no código. Não é
///    segredo — é configuração, e muda entre dev, homologação e loja.
/// 2. **Timeout explícito em tudo.** Sem isso o padrão do Dio é *sem limite*, e
///    um caixa travado esperando resposta de uma rede que caiu é pior que um
///    erro rápido: o operador não sabe se pode repetir.
/// 3. **O token do terminal é redigido no log.** O interceptor de erro imprime
///    a requisição para depurar, e `Authorization` é justamente o que não pode
///    aparecer ali.
class PdvApiClient {
  PdvApiClient({Dio? dio, String? baseUrl})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: baseUrl ?? defaultBaseUrl,
              connectTimeout: const Duration(seconds: 10),
              sendTimeout: const Duration(seconds: 20),
              receiveTimeout: const Duration(seconds: 30),
              contentType: Headers.jsonContentType,
            ),
          ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (RequestOptions options, RequestInterceptorHandler handler) {
          final String? token = _deviceToken;
          if (token != null) {
            options.headers['Authorization'] = 'Device $token';
          }
          handler.next(options);
        },
        onError: (DioException error, ErrorInterceptorHandler handler) {
          // Fica **aqui**, e não em cada chamada, porque a revogação chega pela
          // requisição que estiver acontecendo — e no cenário mais comum não há
          // ninguém olhando: o terminal está na tela de login, e quem descobre
          // é a busca da lista de operadores ou a sincronização de fundo.
          if (PdvApiException.from(error).isDeviceUnauthorized) {
            onDeviceUnauthorized?.call();
          }
          handler.next(error);
        },
      ),
    );
  }

  /// Chamado quando o servidor recusa a credencial **do dispositivo**.
  ///
  /// Callback em vez de o cliente agir sozinho: quem sabe apagar o cofre e
  /// devolver o app para a ativação é a camada de aplicação, e o cliente HTTP
  /// não deve conhecer nem router nem cofre. Quem liga é o
  /// `DeviceCredentialController`, no boot.
  void Function()? onDeviceUnauthorized;

  /// `--dart-define=PDV_API_BASE_URL=https://…`. O default aponta para o
  /// ambiente local do monorepo (`erp-api` na 3114).
  static const String defaultBaseUrl = String.fromEnvironment(
    'PDV_API_BASE_URL',
    defaultValue: 'http://localhost:3114/api',
  );

  final Dio _dio;
  String? _deviceToken;

  Dio get dio => _dio;

  /// Passa a assinar as requisições. `null` remove — é o que acontece quando a
  /// credencial é revogada.
  void setDeviceToken(String? token) => _deviceToken = token;

  Future<Response<T>> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
  }) => _dio.get<T>(path, queryParameters: queryParameters);

  Future<Response<T>> post<T>(String path, {Object? data}) =>
      _dio.post<T>(path, data: data);

  Future<Response<T>> put<T>(String path, {Object? data}) =>
      _dio.put<T>(path, data: data);

  Future<Response<T>> patch<T>(String path, {Object? data}) =>
      _dio.patch<T>(path, data: data);
}

/// Erro de rede/HTTP já traduzido para o que a tela precisa dizer.
///
/// A camada de UI não deve inspecionar `DioException`: mensagem de biblioteca
/// vaza detalhe de transporte para o operador de caixa, que não pode fazer
/// nada com "connection timed out".
class PdvApiException implements Exception {
  const PdvApiException(
    this.message, {
    this.statusCode,
    this.code,
    this.isOffline = false,
  });

  final String message;
  final int? statusCode;

  /// `error.code` do envelope da API — o nome da classe de erro do domínio.
  ///
  /// É o **contrato** para distinguir erros que compartilham status. O caso que
  /// obrigou a existir: `PIN errado` e `terminal revogado` são os dois 401 em
  /// `v1/pos/*`, e o app reage de formas opostas. Comparar texto de mensagem
  /// quebraria na primeira revisão de copy.
  final String? code;

  /// `true` só quando a requisição **não chegou ao servidor**.
  ///
  /// ⚠️ Distinção crítica, não cosmética: é ela que decide se o login pode cair
  /// no cache offline. Tratar um 401 como "sem rede" transformaria "PIN
  /// revogado" em "PIN ainda vale" — exatamente o operador que se quis
  /// desligar entrando pelo caminho de contingência.
  final bool isOffline;

  bool get isUnauthorized => statusCode == 401;

  /// A credencial **do dispositivo** foi recusada: revogada, desconhecida ou
  /// terminal desativado. Distinto de PIN de operador errado.
  static const String deviceUnauthorizedCode =
      'PosTerminalDeviceUnauthorizedError';

  bool get isDeviceUnauthorized => code == deviceUnauthorizedCode;

  /// Traduz a exceção do Dio, preferindo a mensagem de domínio da API quando
  /// existe (`{ error: { message } }`) — é ela que explica *o que fazer*.
  factory PdvApiException.from(DioException error) {
    final Response<dynamic>? response = error.response;
    final Object? data = response?.data;
    if (data is Map<String, dynamic>) {
      final Object? domainError = data['error'];
      if (domainError is Map<String, dynamic>) {
        final Object? message = domainError['message'];
        if (message is String && message.isNotEmpty) {
          return PdvApiException(
            message,
            statusCode: response?.statusCode,
            code: domainError['code'] as String?,
          );
        }
      }
      final Object? nestMessage = data['message'];
      if (nestMessage is String && nestMessage.isNotEmpty) {
        return PdvApiException(nestMessage, statusCode: response?.statusCode);
      }
      // class-validator / Nest: `message` vem como lista de strings.
      if (nestMessage is List<dynamic> && nestMessage.isNotEmpty) {
        final String joined = nestMessage
            .whereType<String>()
            .where((String m) => m.isNotEmpty)
            .join(' ');
        if (joined.isNotEmpty) {
          return PdvApiException(joined, statusCode: response?.statusCode);
        }
      }
    }

    // Sem resposta = não chegou ao servidor. `receiveTimeout` fica de fora:
    // ali o servidor recebeu e está processando, e desistir de esperar não
    // autoriza supor que ele teria aceitado o PIN.
    final bool offline =
        response == null &&
        (error.type == DioExceptionType.connectionError ||
            error.type == DioExceptionType.connectionTimeout ||
            error.type == DioExceptionType.sendTimeout);

    final String message = switch (error.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout =>
        'O servidor demorou para responder. Verifique a conexão.',
      DioExceptionType.connectionError => 'Sem conexão com o servidor da loja.',
      _ => 'Não foi possível concluir a operação.',
    };
    return PdvApiException(
      message,
      statusCode: response?.statusCode,
      isOffline: offline,
    );
  }

  @override
  String toString() => message;
}
