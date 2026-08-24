import SwiftUI

struct EmptyState: View {
    let icon: String
    let title: String
    var subtitle: String? = nil
    var ctaTitle: String? = nil
    var ctaAction: (() -> Void)? = nil

    var body: some View {
        VStack(spacing: CBSpacing.lg) {
            Image(systemName: icon)
                .font(.system(size: 60))
                .foregroundColor(.cbTextDisabled)

            VStack(spacing: CBSpacing.xs) {
                Text(title)
                    .font(CBFont.h3())
                    .foregroundColor(.cbBlack)
                    .multilineTextAlignment(.center)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(CBFont.body2())
                        .foregroundColor(.cbTextSecondary)
                        .multilineTextAlignment(.center)
                }
            }

            if let ctaTitle = ctaTitle, let ctaAction = ctaAction {
                PrimaryButton(title: ctaTitle, action: ctaAction)
                    .frame(maxWidth: 200)
            }
        }
        .padding(CBSpacing.xxl)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}
