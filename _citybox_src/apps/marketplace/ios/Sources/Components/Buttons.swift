import SwiftUI

// MARK: - Primary Button

struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    var isLoading: Bool = false
    var disabled: Bool = false

    var body: some View {
        Button(action: action) {
            Group {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text(title)
                        .font(CBFont.body1())
                        .foregroundColor(.white)
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(disabled ? Color.cbTextDisabled : Color.cbBlack)
            .clipShape(Capsule())
        }
        .disabled(disabled || isLoading)
    }
}

// MARK: - Secondary Button

struct SecondaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(CBFont.body1())
                .foregroundColor(.cbBlack)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.white)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .strokeBorder(Color.cbBlack, lineWidth: 1.5)
                )
        }
    }
}

// MARK: - Text Button

struct TextButton: View {
    let title: String
    let action: () -> Void
    var color: Color = .cbBlack

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(CBFont.body1())
                .foregroundColor(color)
        }
    }
}
