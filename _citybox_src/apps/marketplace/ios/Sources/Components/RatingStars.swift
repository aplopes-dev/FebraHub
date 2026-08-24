import SwiftUI

struct RatingStars: View {
    let rating: Float
    let count: Int
    var compact: Bool = false

    var body: some View {
        HStack(spacing: 2) {
            ForEach(1...5, id: \.self) { star in
                Image(systemName: starImageName(for: star))
                    .font(.system(size: compact ? 10 : 12))
                    .foregroundColor(Color(hex: "F59E0B"))
            }

            Text("(\(count))")
                .font(compact ? CBFont.caption2() : CBFont.caption1())
                .foregroundColor(.cbTextSecondary)
        }
    }

    private func starImageName(for star: Int) -> String {
        let starFloat = Float(star)
        if rating >= starFloat {
            return "star.fill"
        } else if rating >= starFloat - 0.5 {
            return "star.leadinghalf.filled"
        } else {
            return "star"
        }
    }
}
