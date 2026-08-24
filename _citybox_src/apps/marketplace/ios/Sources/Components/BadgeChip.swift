import SwiftUI

enum BadgeChipStyle {
    case success, info, warning, error, neutral

    var background: Color {
        switch self {
        case .success: return .cbTintSuccess
        case .info: return .cbTintInfo
        case .warning: return .cbTintWarning
        case .error: return .cbTintError
        case .neutral: return .cbSurfaceVariant
        }
    }

    var foreground: Color {
        switch self {
        case .success: return .cbGreen
        case .info: return .cbGoogleBlue
        case .warning: return Color(hex: "B45309")
        case .error: return .cbError
        case .neutral: return .cbTextSecondary
        }
    }
}

struct BadgeChip: View {
    let text: String
    var style: BadgeChipStyle = .neutral
    var icon: String? = nil

    var body: some View {
        HStack(spacing: 4) {
            if let icon = icon {
                Image(systemName: icon)
                    .font(.system(size: 11, weight: .semibold))
            }
            Text(text)
                .font(CBFont.badge())
        }
        .foregroundColor(style.foreground)
        .padding(.horizontal, CBSpacing.sm)
        .padding(.vertical, 4)
        .background(style.background)
        .clipShape(Capsule())
        .fixedSize()
    }
}
