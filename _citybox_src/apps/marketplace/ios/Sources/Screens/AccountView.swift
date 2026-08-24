import SwiftUI

struct AccountView: View {
    @Environment(AppState.self) private var appState
    @State private var path = NavigationPath()

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(spacing: CBSpacing.lg) {
                    VStack(spacing: CBSpacing.md) {
                        ZStack {
                            Circle()
                                .fill(Color.cbGreen)
                                .frame(width: 80, height: 80)
                            Text(appState.user.avatarInitial)
                                .font(.system(size: 32, weight: .bold))
                                .foregroundColor(.white)
                        }

                        VStack(spacing: 4) {
                            Text(appState.user.name)
                                .font(CBFont.h3())
                                .foregroundColor(.cbBlack)
                            Text(appState.user.email)
                                .font(CBFont.body2())
                                .foregroundColor(.cbTextSecondary)
                        }

                        NavigationLink(value: AccountRoute.editProfile) {
                            Text("Editar perfil")
                                .font(CBFont.caption1())
                                .foregroundColor(.cbBlack)
                                .padding(.horizontal, CBSpacing.lg)
                                .padding(.vertical, CBSpacing.xs)
                                .overlay(
                                    Capsule().strokeBorder(Color.cbBlack, lineWidth: 1)
                                )
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.top, CBSpacing.lg)

                    NavigationLink(value: AccountRoute.subscription) {
                        HStack(spacing: 12) {
                            Text("✦")
                                .font(.system(size: 26))
                                .foregroundColor(.white)

                            VStack(alignment: .leading, spacing: 4) {
                                Text("CityBox+ ativo")
                                    .font(.system(size: 15, weight: .heavy))
                                    .foregroundColor(.white)

                                Text("Entregas grátis e benefícios exclusivos")
                                    .font(.system(size: 12))
                                    .foregroundColor(.white.opacity(0.8))
                            }

                            Spacer()

                            Text("Gerenciar")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundColor(.white)
                        }
                        .padding(CBSpacing.lg)
                        .background(
                            ZStack {
                                Image("banner_citybox_plus")
                                    .resizable()
                                    .scaledToFill()
                                LinearGradient(
                                    colors: [Color.black.opacity(0.5), Color.black.opacity(0.6)],
                                    startPoint: UnitPoint(x: 0, y: 0),
                                    endPoint: UnitPoint(x: 1, y: 1)
                                )
                            }
                        )
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
                        .shadow(color: .black.opacity(0.18), radius: 7, x: 0, y: 4)
                    }
                    .buttonStyle(.plain)

                    VStack(spacing: 0) {
                        MenuRow(icon: "bag", title: "Minhas Compras", subtitle: "\(appState.orders.count) pedidos") {
                            path = NavigationPath()
                            appState.requestTab(3)
                        }
                        Divider().padding(.leading, 48)
                        MenuRow(icon: "heart", title: "Favoritos", subtitle: "\(appState.favorites.count) itens") {
                            path = NavigationPath()
                            appState.requestTab(1)
                        }
                        Divider().padding(.leading, 48)
                        NavigationLink(value: AccountRoute.addresses) {
                            menuRowLabel(icon: "location", title: "Endereços")
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 48)
                        NavigationLink(value: AccountRoute.paymentMethods) {
                            menuRowLabel(icon: "creditcard", title: "Meus Cartões")
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 48)
                        NavigationLink(value: AccountRoute.coupons) {
                            menuRowLabel(icon: "tag", title: "Cupons")
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 48)
                        NavigationLink(value: AccountRoute.notifications) {
                            menuRowLabel(icon: "bell", title: "Notificações")
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 48)
                        NavigationLink(value: AccountRoute.help) {
                            menuRowLabel(icon: "questionmark.circle", title: "Ajuda e Suporte")
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 48)
                        NavigationLink(value: AccountRoute.settings) {
                            menuRowLabel(icon: "gearshape", title: "Configurações")
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, CBSpacing.lg)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                    VStack(spacing: 0) {
                        NavigationLink(value: AccountRoute.staticPage(.about)) {
                            menuRowLabel(icon: "info.circle", title: "Sobre o CityBox")
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 48)
                        NavigationLink(value: AccountRoute.staticPage(.terms)) {
                            menuRowLabel(icon: "doc.text", title: "Termos de Uso")
                        }
                        .buttonStyle(.plain)
                        Divider().padding(.leading, 48)
                        NavigationLink(value: AccountRoute.staticPage(.privacy)) {
                            menuRowLabel(icon: "lock.shield", title: "Política de Privacidade")
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, CBSpacing.lg)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))

                    Button {
                        appState.logout()
                    } label: {
                        HStack {
                            Image(systemName: "arrow.right.square")
                                .foregroundColor(.red)
                            Text("Sair da conta")
                                .font(CBFont.body2())
                                .foregroundColor(.red)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
                    }

                    Text("CityBox v1.0 · © 2024")
                        .font(CBFont.caption2())
                        .foregroundColor(.cbTextDisabled)
                        .padding(.bottom, CBSpacing.lg)
                }
                .padding(.horizontal, CBSpacing.lg)
            }
            .background(Color.cbSurface)
            .navigationTitle("Minha Conta")
            .navigationBarTitleDisplayMode(.inline)
            .cbDarkNavBar()
            .navigationDestination(for: AccountRoute.self) { route in
                switch route {
                case .editProfile:
                    EditProfileView()
                case .addresses:
                    AddressListView()
                case .addressSelection:
                    AddressListView(selectionMode: true)
                case .addAddress:
                    AddressFormView(addressId: nil)
                case .editAddress(let id):
                    AddressFormView(addressId: id)
                case .paymentMethods:
                    PaymentMethodsView()
                case .addCard:
                    CardFormView()
                case .settings:
                    SettingsView()
                case .staticPage(let type):
                    StaticPageView(pageType: type)
                case .subscription:
                    SubscriptionView()
                case .coupons:
                    CouponsView()
                case .shippingOptions:
                    ShippingOptionsView()
                case .notifications:
                    NotificationsView()
                case .help:
                    HelpView()
                case .chat:
                    ChatView()
                case .openTicket:
                    OpenTicketView()
                case .myTickets:
                    TicketsListView()
                }
            }
        }
    }

    private func menuRowLabel(icon: String, title: String) -> some View {
        HStack(spacing: CBSpacing.md) {
            Image(systemName: icon)
                .font(.system(size: 18))
                .foregroundColor(.cbBlack)
                .frame(width: 28)
            Text(title)
                .font(CBFont.body2())
                .foregroundColor(.cbBlack)
            Spacer()
            Image(systemName: "chevron.right")
                .font(.system(size: 13, weight: .medium))
                .foregroundColor(.cbTextDisabled)
        }
        .padding(.vertical, CBSpacing.sm)
        .contentShape(Rectangle())
    }
}
