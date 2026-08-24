import Foundation

/// Modo de dados do app: mock in-memory (MockData) ou BFF real.
enum ApiMode: Equatable {
    case mock
    case live(baseURL: URL)
}

enum AppConfig {
    /// URL de produção do BFF do marketplace.
    static let productionBaseURL = URL(string: "https://citybox.com.br/api")!

    /// Modo resolvido por build config:
    /// - DEBUG: `mock` por padrão; se a env `CITYBOX_API_URL` estiver definida
    ///   (ex.: `http://127.0.0.1:3102/api`), usa `live` apontando para ela.
    /// - RELEASE: sempre `live` em produção.
    static let apiMode: ApiMode = {
        #if DEBUG
        if let raw = ProcessInfo.processInfo.environment["CITYBOX_API_URL"],
           let url = URL(string: raw), url.scheme != nil {
            return .live(baseURL: url)
        }
        return .mock
        #else
        return .live(baseURL: productionBaseURL)
        #endif
    }()

    static var isLive: Bool {
        if case .live = apiMode { return true }
        return false
    }

    static var liveBaseURL: URL? {
        if case .live(let url) = apiMode { return url }
        return nil
    }
}
