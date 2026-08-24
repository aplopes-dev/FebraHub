import SwiftUI

enum PaymentOptionIcon: Hashable {
    case system(String)
    case pix
}

struct PaymentOption: Identifiable {
    let id: String
    let title: String
    let subtitle: String?
    let icon: PaymentOptionIcon
    let discountLabel: String?
}

struct PaymentOptionRow: View {
    let option: PaymentOption
    let isSelected: Bool
    let onTap: () -> Void

    private var iconColor: Color {
        isSelected ? .cbGreen : .cbTextSecondary
    }

    @ViewBuilder
    private var optionIcon: some View {
        switch option.icon {
        case .system(let name):
            Image(systemName: name)
                .font(.system(size: 20))
                .foregroundColor(iconColor)
        case .pix:
            Image("icon_pix")
                .renderingMode(.template)
                .resizable()
                .scaledToFit()
                .frame(width: 20, height: 20)
                .foregroundStyle(iconColor)
        }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: CBSpacing.md) {
                ZStack {
                    Circle()
                        .strokeBorder(isSelected ? Color.cbGreen : Color.cbBorderStrong, lineWidth: 2)
                        .frame(width: 22, height: 22)

                    if isSelected {
                        Circle()
                            .fill(Color.cbGreen)
                            .frame(width: 12, height: 12)
                    }
                }

                optionIcon
                    .frame(width: 28)

                VStack(alignment: .leading, spacing: 2) {
                    Text(option.title)
                        .font(CBFont.body2())
                        .foregroundColor(.cbBlack)

                    if let subtitle = option.subtitle {
                        Text(subtitle)
                            .font(CBFont.caption2())
                            .foregroundColor(.cbTextSecondary)
                    }
                }

                Spacer()

                if let label = option.discountLabel {
                    BadgeChip(text: label, style: .success)
                        .fixedSize()
                }
            }
            .padding(CBSpacing.md)
            .background(isSelected ? Color.cbTintSuccess : Color.white)
            .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
            .overlay(
                RoundedRectangle(cornerRadius: CBRadius.input)
                    .strokeBorder(isSelected ? Color.cbGreen : Color.cbBorder, lineWidth: isSelected ? 1.5 : 1)
            )
        }
        .buttonStyle(.plain)
    }
}
