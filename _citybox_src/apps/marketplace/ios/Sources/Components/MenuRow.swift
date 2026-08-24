import SwiftUI

struct MenuRow: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var iconColor: Color = .cbBlack
    var action: (() -> Void)? = nil

    var body: some View {
        Button {
            action?()
        } label: {
            HStack(spacing: CBSpacing.md) {
                Image(systemName: icon)
                    .font(.system(size: 18))
                    .foregroundColor(iconColor)
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(CBFont.body2())
                        .foregroundColor(.cbBlack)

                    if let subtitle = subtitle {
                        Text(subtitle)
                            .font(CBFont.caption2())
                            .foregroundColor(.cbTextSecondary)
                    }
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(.cbTextDisabled)
            }
            .padding(.vertical, CBSpacing.sm)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}
