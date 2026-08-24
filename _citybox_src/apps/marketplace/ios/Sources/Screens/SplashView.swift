import SwiftUI

struct SplashView: View {
    var onFinished: () -> Void

    @State private var logoScale: CGFloat = 0.55
    @State private var logoOpacity: Double = 0
    @State private var glowOpacity: Double = 0
    @State private var glowScale: CGFloat = 0.75
    @State private var screenOpacity: Double = 1

    var body: some View {
        ZStack {
            Color(hex: "111111").ignoresSafeArea()

            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            Color.cbGreen.opacity(0.32),
                            Color.cbGreen.opacity(0.07),
                            .clear
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: 130
                    )
                )
                .frame(width: 260, height: 260)
                .scaleEffect(glowScale)
                .opacity(glowOpacity)

            CityBoxLogoMark(size: 128)
                .scaleEffect(logoScale)
                .opacity(logoOpacity)
        }
        .opacity(screenOpacity)
        .onAppear { startAnimation() }
    }

    private func startAnimation() {
        withAnimation(.easeOut(duration: 0.55)) {
            glowOpacity = 1
            glowScale = 1
        }
        withAnimation(.easeOut(duration: 0.42)) {
            logoOpacity = 1
        }
        withAnimation(.spring(response: 0.72, dampingFraction: 0.64)) {
            logoScale = 1
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 1.75) {
            withAnimation(.easeIn(duration: 0.38)) {
                screenOpacity = 0
            }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.38) {
                onFinished()
            }
        }
    }
}
