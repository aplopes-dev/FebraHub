import SwiftUI

struct SearchField: View {
    @Binding var text: String
    var placeholder: String = "Buscar produtos..."
    var onSubmit: (() -> Void)? = nil

    var body: some View {
        HStack(spacing: CBSpacing.sm) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.cbTextSecondary)
                .font(.system(size: 16))

            TextField(placeholder, text: $text)
                .font(CBFont.body2())
                .foregroundColor(.cbBlack)
                .submitLabel(.search)
                .onSubmit { onSubmit?() }

            if !text.isEmpty {
                Button {
                    text = ""
                } label: {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.cbTextSecondary)
                        .font(.system(size: 16))
                }
            }
        }
        .padding(.horizontal, CBSpacing.md)
        .padding(.vertical, CBSpacing.sm + 2)
        .background(Color.cbSurface)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
    }
}
