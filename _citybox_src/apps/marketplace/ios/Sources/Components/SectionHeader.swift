import SwiftUI

struct SectionHeader: View {
    let title: String
    var actionTitle: String? = "Ver tudo"
    var action: (() -> Void)? = nil

    var body: some View {
        HStack {
            Text(title)
                .font(CBFont.section())
                .foregroundColor(.cbBlack)

            Spacer()

            if let actionTitle = actionTitle, let action = action {
                Button(action: action) {
                    Text(actionTitle)
                        .font(CBFont.body2())
                        .foregroundColor(.cbBlack)
                }
            }
        }
    }
}
