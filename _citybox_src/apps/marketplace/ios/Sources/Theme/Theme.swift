import SwiftUI

// MARK: - Theme environment values

private struct CBThemeKey: EnvironmentKey {
    static let defaultValue: CBThemeValues = CBThemeValues()
}

extension EnvironmentValues {
    var cbTheme: CBThemeValues {
        get { self[CBThemeKey.self] }
        set { self[CBThemeKey.self] = newValue }
    }
}

struct CBThemeValues {
    let primaryColor: Color = .cbBlack
    let backgroundColor: Color = .cbSurface
    let textPrimary: Color = .cbBlack
    let textSecondary: Color = .cbTextSecondary
}

// MARK: - ViewModifier for card styling

struct CBCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
            .shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
    }
}

extension View {
    func cbCard() -> some View {
        modifier(CBCardModifier())
    }
}
