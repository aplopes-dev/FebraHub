import SwiftUI

struct TrackingTimeline: View {
    let currentStatus: OrderStatus

    private let steps: [OrderStatus] = [.confirmed, .preparing, .shipped, .delivered]

    private func stepIndex(_ status: OrderStatus) -> Int {
        steps.firstIndex(of: status) ?? 0
    }

    private var currentIndex: Int {
        stepIndex(currentStatus)
    }

    var body: some View {
        HStack(alignment: .top, spacing: 0) {
            ForEach(Array(steps.enumerated()), id: \.offset) { idx, step in
                VStack(spacing: 4) {
                    ZStack {
                        Circle()
                            .fill(idx <= currentIndex ? Color.cbGreen : Color.cbSurfaceVariant)
                            .frame(width: 20, height: 20)

                        if idx <= currentIndex {
                            Image(systemName: idx < currentIndex ? "checkmark" : "circle.fill")
                                .font(.system(size: idx < currentIndex ? 10 : 6, weight: .bold))
                                .foregroundColor(.white)
                        } else {
                            Circle()
                                .strokeBorder(Color.cbBorderStrong, lineWidth: 1.5)
                                .frame(width: 20, height: 20)
                        }
                    }

                    Text(step.rawValue)
                        .font(CBFont.caption2())
                        .foregroundColor(idx <= currentIndex ? .cbGreen : .cbTextDisabled)
                        .multilineTextAlignment(.center)
                        .frame(width: 70)
                }

                if idx < steps.count - 1 {
                    Rectangle()
                        .fill(idx < currentIndex ? Color.cbGreen : Color.cbSurfaceVariant)
                        .frame(height: 2)
                        .padding(.top, 9)
                }
            }
        }
        .padding(.vertical, CBSpacing.sm)
    }
}
