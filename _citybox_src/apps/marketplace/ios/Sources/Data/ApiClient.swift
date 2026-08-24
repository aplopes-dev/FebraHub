import Foundation
import Security

// MARK: - Envelope & erros do contrato

struct ApiErrorItem: Decodable, Sendable {
    let code: String
    let message: String
    let field: String?
}

/// Envelope padrão do BFF: `{ data, meta?, errors? }`.
struct ApiEnvelope<T: Decodable>: Decodable {
    let data: T?
    let errors: [ApiErrorItem]?
}

enum ApiClientError: Error, LocalizedError {
    case notConfigured
    case invalidURL
    case transport(Error)
    case http(status: Int, errors: [ApiErrorItem])
    case decoding(Error)
    case unauthorized
    case emptyData

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "API não configurada"
        case .invalidURL: return "URL inválida"
        case .transport: return "Falha de conexão. Verifique sua internet."
        case .http(let status, let errors):
            if let first = errors.first { return first.message }
            return "Erro do servidor (\(status))"
        case .decoding: return "Resposta inesperada do servidor"
        case .unauthorized: return "Sessão expirada. Faça login novamente."
        case .emptyData: return "Resposta vazia do servidor"
        }
    }
}

// MARK: - Keychain

/// Armazenamento simples de tokens no Keychain (Security framework).
enum KeychainStorage {
    private static let service = "com.citybox.marketplace.auth"

    static func save(_ value: String, forKey key: String) {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        let attributes: [String: Any] = [kSecValueData as String: data]
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        if status == errSecItemNotFound {
            var addQuery = query
            addQuery[kSecValueData as String] = data
            addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
            SecItemAdd(addQuery as CFDictionary, nil)
        }
    }

    static func read(_ key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func delete(_ key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Client

/// Client fino sobre URLSession para o BFF do CityBox.
/// Bearer JWT + refresh automático (uma tentativa) em 401.
actor ApiClient {
    static let shared = ApiClient()

    private static let accessTokenKey = "accessToken"
    private static let refreshTokenKey = "refreshToken"

    private let session: URLSession
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()

    init(session: URLSession = .shared) {
        self.session = session
    }

    // MARK: Tokens

    func setTokens(access: String, refresh: String?) {
        KeychainStorage.save(access, forKey: Self.accessTokenKey)
        if let refresh {
            KeychainStorage.save(refresh, forKey: Self.refreshTokenKey)
        }
    }

    func clearTokens() {
        KeychainStorage.delete(Self.accessTokenKey)
        KeychainStorage.delete(Self.refreshTokenKey)
    }

    var hasStoredSession: Bool {
        KeychainStorage.read(Self.accessTokenKey) != nil
    }

    // MARK: Requests

    struct EmptyResponse: Decodable {}

    /// Request genérico que desembrulha o envelope `{ data }`.
    func request<T: Decodable>(
        _ method: String,
        _ path: String,
        body: (any Encodable)? = nil,
        auth: Bool = true,
        headers: [String: String] = [:]
    ) async throws -> T {
        let envelope: ApiEnvelope<T> = try await send(
            method, path, body: body, auth: auth, headers: headers, allowRefresh: true
        )
        guard let data = envelope.data else {
            throw ApiClientError.emptyData
        }
        return data
    }

    /// Request cujo payload é irrelevante (204 / envelope sem data).
    func requestVoid(
        _ method: String,
        _ path: String,
        body: (any Encodable)? = nil,
        auth: Bool = true,
        headers: [String: String] = [:]
    ) async throws {
        let _: ApiEnvelope<EmptyResponse> = try await send(
            method, path, body: body, auth: auth, headers: headers, allowRefresh: true
        )
    }

    // MARK: Internals

    private func send<T: Decodable>(
        _ method: String,
        _ path: String,
        body: (any Encodable)?,
        auth: Bool,
        headers: [String: String],
        allowRefresh: Bool
    ) async throws -> ApiEnvelope<T> {
        guard let baseURL = AppConfig.liveBaseURL else {
            throw ApiClientError.notConfigured
        }
        guard let url = URL(string: baseURL.absoluteString + path) else {
            throw ApiClientError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 20
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }
        if let body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(AnyEncodable(body))
        }
        if auth, let token = KeychainStorage.read(Self.accessTokenKey) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await session.data(for: request)
        } catch {
            throw ApiClientError.transport(error)
        }

        guard let http = response as? HTTPURLResponse else {
            throw ApiClientError.transport(URLError(.badServerResponse))
        }

        if http.statusCode == 401, auth {
            if allowRefresh, await refreshAccessToken() {
                return try await send(method, path, body: body, auth: auth, headers: headers, allowRefresh: false)
            }
            clearTokens()
            throw ApiClientError.unauthorized
        }

        guard (200 ..< 300).contains(http.statusCode) else {
            let errors = (try? decoder.decode(ApiEnvelope<EmptyResponse>.self, from: data))?.errors ?? []
            throw ApiClientError.http(status: http.statusCode, errors: errors)
        }

        if data.isEmpty {
            return ApiEnvelope<T>(data: nil, errors: nil)
        }
        do {
            return try decoder.decode(ApiEnvelope<T>.self, from: data)
        } catch {
            throw ApiClientError.decoding(error)
        }
    }

    private struct RefreshRequest: Encodable {
        let refreshToken: String
    }

    private struct RefreshData: Decodable {
        let accessToken: String
        let expiresIn: Int?
    }

    private func refreshAccessToken() async -> Bool {
        guard let refreshToken = KeychainStorage.read(Self.refreshTokenKey) else { return false }
        do {
            let refreshed: ApiEnvelope<RefreshData> = try await send(
                "POST", "/auth/refresh",
                body: RefreshRequest(refreshToken: refreshToken),
                auth: false, headers: [:], allowRefresh: false
            )
            guard let access = refreshed.data?.accessToken else { return false }
            KeychainStorage.save(access, forKey: Self.accessTokenKey)
            return true
        } catch {
            return false
        }
    }
}

/// Type-eraser para aceitar qualquer Encodable como body.
private struct AnyEncodable: Encodable {
    private let value: any Encodable

    init(_ value: any Encodable) {
        self.value = value
    }

    func encode(to encoder: Encoder) throws {
        try value.encode(to: encoder)
    }
}
