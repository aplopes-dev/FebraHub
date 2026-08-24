import SwiftUI

/// The CityBox "box" logomark (black rounded square + white isometric cube),
/// matching the brand mark used across the design-system screens.
struct CityBoxLogoMark: View {
    var size: CGFloat = 32

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 34.0 / 143.0 * size)
                .fill(Color.black)
            CityBoxCubeShape()
                .fill(Color.white)
        }
        .frame(width: size, height: size)
    }
}

private struct CityBoxCubeShape: Shape {
    func path(in rect: CGRect) -> Path {
        let s = min(rect.width, rect.height) / 143.0
        func p(_ x: CGFloat, _ y: CGFloat) -> CGPoint { CGPoint(x: x * s, y: y * s) }
        var path = Path()
        // Top face
        path.move(to: p(71.463, 30.228))
        path.addLine(to: p(108.045, 44.351))
        path.addLine(to: p(71.463, 58.478))
        path.addLine(to: p(34.881, 44.351))
        path.closeSubpath()
        // Left face
        path.move(to: p(34.878, 88.817))
        path.addLine(to: p(68.120, 109.623))
        path.addLine(to: p(68.120, 67.158))
        path.addLine(to: p(53.172, 57.515))
        path.addLine(to: p(34.880, 45.718))
        path.addLine(to: p(34.878, 69.316))
        path.closeSubpath()
        // Right face
        path.move(to: p(108.049, 88.820))
        path.addLine(to: p(74.805, 109.623))
        path.addLine(to: p(74.805, 67.158))
        path.addLine(to: p(89.753, 57.515))
        path.addLine(to: p(108.047, 45.718))
        path.addLine(to: p(108.049, 69.316))
        path.closeSubpath()
        return path
    }
}
