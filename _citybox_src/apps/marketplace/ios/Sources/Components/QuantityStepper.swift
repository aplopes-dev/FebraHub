import SwiftUI

struct QuantityStepper: View {
    @Binding var quantity: Int
    var min: Int = 1
    var max: Int = 99

    var body: some View {
        HStack(spacing: CBSpacing.sm) {
            Button {
                if quantity > min { quantity -= 1 }
            } label: {
                Image(systemName: "minus")
                    .font(.system(size: 14, weight: .medium))
                    .frame(width: 32, height: 32)
                    .background(Color.cbSurface)
                    .clipShape(Circle())
                    .foregroundColor(quantity <= min ? .cbTextDisabled : .cbBlack)
            }
            .disabled(quantity <= min)

            Text("\(quantity)")
                .font(CBFont.body1())
                .foregroundColor(.cbBlack)
                .frame(width: 32, alignment: .center)

            Button {
                if quantity < max { quantity += 1 }
            } label: {
                Image(systemName: "plus")
                    .font(.system(size: 14, weight: .medium))
                    .frame(width: 32, height: 32)
                    .background(Color.cbSurface)
                    .clipShape(Circle())
                    .foregroundColor(quantity >= max ? .cbTextDisabled : .cbBlack)
            }
            .disabled(quantity >= max)
        }
    }
}
