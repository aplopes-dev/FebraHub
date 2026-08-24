import SwiftUI

extension Color {
    static let cbGreen = Color(hex: "00A650")
    static let cbBlack = Color(hex: "111111")
    static let cbWhite = Color.white
    static let cbSurface = Color(hex: "F5F5F5")
    static let cbSurfaceVariant = Color(hex: "EDEDED")
    static let cbTextSecondary = Color(hex: "111111").opacity(0.6)
    static let cbTextTertiary = Color(hex: "111111").opacity(0.55)
    static let cbTextDisabled = Color(hex: "111111").opacity(0.38)
    static let cbBorder = Color(hex: "111111").opacity(0.06)
    static let cbBorderStrong = Color(hex: "111111").opacity(0.08)
    static let cbTintSuccess = Color(hex: "E6F4EA")
    static let cbTintInfo = Color(hex: "EEF3FB")
    static let cbTintWarning = Color(hex: "FBF1E3")
    static let cbTintError = Color(hex: "FDE8E8")
    static let cbError = Color(hex: "FF8A80")
    static let cbGoogleBlue = Color(hex: "4285F4")
    static let cbPlusGradientStart = Color(hex: "2D2D44")
    static let cbPlusGradientEnd = Color(hex: "161616")
    static let cbHeroGradientStart = Color(hex: "2B2B2F")
    static let cbHeroGradientEnd = Color(hex: "111111")
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8) & 0xFF) / 255
        let b = Double(int & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
