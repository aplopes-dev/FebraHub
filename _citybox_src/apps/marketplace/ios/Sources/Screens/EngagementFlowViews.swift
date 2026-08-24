import SwiftUI

// MARK: - F1 Notifications

struct NotificationsView: View {
    @Environment(AppState.self) private var appState

    private var hasUnread: Bool {
        appState.notifications.contains { !$0.isRead }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: CBSpacing.md) {
                if hasUnread {
                    Button {
                        appState.markAllNotificationsRead()
                    } label: {
                        Text("Marcar todas como lidas")
                            .font(CBFont.caption2())
                            .fontWeight(.semibold)
                            .foregroundColor(.cbGreen)
                            .frame(maxWidth: .infinity, alignment: .trailing)
                    }
                }

                ForEach(appState.notifications) { notification in
                    NotificationCard(notification: notification) {
                        appState.markNotificationRead(notification.id)
                    }
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Notificações")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

private struct NotificationCard: View {
    let notification: AppNotification
    let onTap: () -> Void

    private var iconName: String {
        switch notification.type {
        case .order: return "bag"
        case .promo: return "tag"
        case .system: return "info.circle"
        }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    Circle()
                        .fill(Color.cbGreen.opacity(0.12))
                        .frame(width: 40, height: 40)
                    Image(systemName: iconName)
                        .font(.system(size: 18))
                        .foregroundColor(.cbGreen)
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(notification.title)
                            .font(CBFont.body1())
                            .fontWeight(.semibold)
                            .foregroundColor(.cbBlack)
                        Spacer()
                        if !notification.isRead {
                            Circle()
                                .fill(Color.cbGreen)
                                .frame(width: 8, height: 8)
                        }
                    }
                    Text(notification.body)
                        .font(CBFont.body2())
                        .foregroundColor(.cbTextSecondary)
                        .multilineTextAlignment(.leading)
                    Text(notification.date)
                        .font(CBFont.caption1())
                        .foregroundColor(.cbTextSecondary)
                }
            }
            .padding(CBSpacing.lg)
            .background(notification.isRead ? Color.white : Color.cbGreen.opacity(0.08))
            .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
            .overlay(
                RoundedRectangle(cornerRadius: CBRadius.card)
                    .strokeBorder(notification.isRead ? Color.cbBorder : Color.cbGreen.opacity(0.4), lineWidth: 1)
            )
        }
        .buttonStyle(.plain)
    }
}

// MARK: - F2 Help / FAQ

struct HelpView: View {
    @Environment(AppState.self) private var appState
    @State private var expandedQuestions: Set<String> = []

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CBSpacing.md) {
                Text("Perguntas frequentes")
                    .font(CBFont.h3())
                    .foregroundColor(.cbBlack)

                ForEach(appState.faqItems) { item in
                    FaqRow(
                        item: item,
                        isExpanded: expandedQuestions.contains(item.id),
                        onToggle: {
                            if expandedQuestions.contains(item.id) {
                                expandedQuestions.remove(item.id)
                            } else {
                                expandedQuestions.insert(item.id)
                            }
                        }
                    )
                }

                NavigationLink(value: AccountRoute.openTicket) {
                    Text("Abrir chamado")
                        .font(CBFont.body1())
                        .foregroundColor(.cbBlack)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                        .overlay(
                            RoundedRectangle(cornerRadius: CBRadius.input)
                                .strokeBorder(Color.cbBlack, lineWidth: 1.5)
                        )
                }
                .buttonStyle(.plain)
                .padding(.top, CBSpacing.sm)

                NavigationLink(value: AccountRoute.myTickets) {
                    Text("Meus chamados")
                        .font(CBFont.body1())
                        .foregroundColor(.cbBlack)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                        .overlay(
                            RoundedRectangle(cornerRadius: CBRadius.input)
                                .strokeBorder(Color.cbBlack, lineWidth: 1.5)
                        )
                }
                .buttonStyle(.plain)

                NavigationLink(value: AccountRoute.chat) {
                    Text("Falar com atendente")
                        .font(CBFont.body1())
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cbGreen)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                }
                .buttonStyle(.plain)
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Ajuda e Suporte")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

private struct FaqRow: View {
    let item: FaqItem
    let isExpanded: Bool
    let onToggle: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Button(action: onToggle) {
                HStack {
                    Text(item.question)
                        .font(CBFont.body1())
                        .foregroundColor(.cbBlack)
                        .multilineTextAlignment(.leading)
                    Spacer()
                    Image(systemName: isExpanded ? "chevron.up" : "chevron.down")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(.cbTextSecondary)
                }
                .padding(CBSpacing.lg)
            }
            .buttonStyle(.plain)

            if isExpanded {
                Text(item.answer)
                    .font(CBFont.body2())
                    .foregroundColor(.cbTextSecondary)
                    .padding(.horizontal, CBSpacing.lg)
                    .padding(.bottom, CBSpacing.lg)
            }
        }
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
        .overlay(
            RoundedRectangle(cornerRadius: CBRadius.card)
                .strokeBorder(Color.cbBorder, lineWidth: 1)
        )
    }
}

// MARK: - F3-alt Open Ticket

struct OpenTicketView: View {
    @Environment(AppState.self) private var appState
    @Environment(\.dismiss) private var dismiss

    @State private var subject = ""
    @State private var message = ""
    @State private var selectedOrderId = ""
    @State private var error: String?
    @State private var confirmation: CreatedTicket?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: CBSpacing.md) {
                if let confirmation {
                    confirmationCard(confirmation)
                    PrimaryButton(title: "Voltar à Ajuda") {
                        dismiss()
                    }
                } else {
                    Text("Descreva sua solicitação. Você receberá o número do ticket ao enviar.")
                        .font(CBFont.body2())
                        .foregroundColor(.cbTextSecondary)

                    ticketField(label: "Assunto", text: $subject, placeholder: "Ex.: Problema com entrega")

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Mensagem")
                            .font(CBFont.caption1())
                            .foregroundColor(.cbTextSecondary)
                        TextField("Descreva o que aconteceu...", text: $message, axis: .vertical)
                            .lineLimit(4...8)
                            .padding(12)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                    }

                    if !appState.orders.isEmpty {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Pedido relacionado (opcional)")
                                .font(CBFont.caption1())
                                .foregroundColor(.cbTextSecondary)
                            Picker("Pedido", selection: $selectedOrderId) {
                                Text("Nenhum pedido").tag("")
                                ForEach(appState.orders) { order in
                                    Text("Pedido #\(order.id)").tag(order.id)
                                }
                            }
                            .pickerStyle(.menu)
                            .padding(12)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(Color.white)
                            .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                        }
                    }

                    if let error {
                        Text(error)
                            .font(CBFont.body2())
                            .foregroundColor(.cbBlack)
                    }

                    PrimaryButton(
                        title: "Enviar chamado",
                        action: submitTicket,
                        disabled: subject.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                            || message.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                    )
                }
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Abrir chamado")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }

    @ViewBuilder
    private func confirmationCard(_ ticket: CreatedTicket) -> some View {
        VStack(spacing: CBSpacing.sm) {
            Text("Chamado aberto ✓")
                .font(CBFont.h3())
                .foregroundColor(.cbGreen)
            Text("Seu ticket foi registrado. A equipe responderá em breve.")
                .font(CBFont.body2())
                .foregroundColor(.cbTextSecondary)
                .multilineTextAlignment(.center)
            VStack(alignment: .leading, spacing: 4) {
                Text("Ticket: \(ticket.ticketId)")
                    .font(CBFont.body2())
                    .foregroundColor(.cbBlack)
                Text("Status: \(ticket.status)")
                    .font(CBFont.body2())
                    .foregroundColor(.cbBlack)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, CBSpacing.sm)
        }
        .padding(CBSpacing.lg)
        .frame(maxWidth: .infinity)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
        .overlay(
            RoundedRectangle(cornerRadius: CBRadius.card)
                .strokeBorder(Color.cbBorder, lineWidth: 1)
        )
    }

    private func ticketField(label: String, text: Binding<String>, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(CBFont.caption1())
                .foregroundColor(.cbTextSecondary)
            TextField(placeholder, text: text)
                .padding(12)
                .background(Color.white)
                .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
        }
    }

    private func submitTicket() {
        let trimmedSubject = subject.trimmingCharacters(in: .whitespacesAndNewlines)
        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedSubject.isEmpty, !trimmedMessage.isEmpty else {
            error = "Preencha assunto e mensagem."
            return
        }
        error = nil
        let orderId = selectedOrderId.isEmpty ? nil : selectedOrderId
        if let result = appState.createTicket(subject: trimmedSubject, message: trimmedMessage, orderId: orderId) {
            confirmation = result
        } else {
            error = "Preencha assunto e mensagem."
        }
    }
}

// MARK: - F3 Chat

struct ChatView: View {
    @Environment(AppState.self) private var appState
    @State private var input = ""

    var body: some View {
        VStack(spacing: 0) {
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: CBSpacing.sm) {
                        ForEach(appState.chatMessages) { message in
                            ChatBubble(message: message)
                                .id(message.id)
                        }
                    }
                    .padding(CBSpacing.lg)
                }
                .onChange(of: appState.chatMessages.count) { _, _ in
                    if let last = appState.chatMessages.last {
                        withAnimation {
                            proxy.scrollTo(last.id, anchor: .bottom)
                        }
                    }
                }
            }

            HStack(spacing: CBSpacing.sm) {
                TextField("Digite sua mensagem…", text: $input)
                    .padding(12)
                    .background(Color.white)
                    .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))

                Button {
                    appState.sendChatMessage(input)
                    input = ""
                } label: {
                    Image(systemName: "paperplane.fill")
                        .foregroundColor(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .cbTextDisabled : .cbGreen)
                        .frame(width: 44, height: 44)
                }
                .disabled(input.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding(CBSpacing.md)
            .background(Color.white)
        }
        .background(Color.cbSurface)
        .navigationTitle("Atendimento")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }
}

private struct ChatBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.isAgent { bubble(alignLeading: true) }
            Spacer(minLength: 48)
            if !message.isAgent { bubble(alignLeading: false) }
        }
    }

    @ViewBuilder
    private func bubble(alignLeading: Bool) -> some View {
        VStack(alignment: alignLeading ? .leading : .trailing, spacing: 4) {
            Text(message.text)
                .font(CBFont.body2())
                .foregroundColor(message.isAgent ? .cbBlack : .white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(message.isAgent ? Color.white : Color.cbGreen)
                .clipShape(RoundedRectangle(cornerRadius: 16))
            Text(message.time)
                .font(CBFont.caption2())
                .foregroundColor(.cbTextSecondary)
        }
        .frame(maxWidth: 280, alignment: alignLeading ? .leading : .trailing)
    }
}

// MARK: - My Tickets List

struct TicketsListView: View {
    @Environment(AppState.self) private var appState

    var body: some View {
        ScrollView {
            VStack(spacing: CBSpacing.md) {
                if appState.tickets.isEmpty {
                    Text("Nenhum chamado aberto")
                        .font(CBFont.body2())
                        .foregroundColor(.cbTextSecondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(CBSpacing.lg)
                        .background(Color.white)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
                } else {
                    ForEach(appState.tickets, id: \.ticketId) { ticket in
                        ticketCard(ticket)
                    }
                }

                NavigationLink(value: AccountRoute.openTicket) {
                    Text("Abrir novo chamado")
                        .font(CBFont.body1())
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(Color.cbGreen)
                        .clipShape(RoundedRectangle(cornerRadius: CBRadius.input))
                }
                .buttonStyle(.plain)
                .padding(.top, CBSpacing.sm)
            }
            .padding(CBSpacing.lg)
        }
        .background(Color.cbSurface)
        .navigationTitle("Meus chamados")
        .navigationBarTitleDisplayMode(.inline)
        .cbLightNavBar()
    }

    private func ticketCard(_ ticket: SupportTicket) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(ticket.subject)
                    .font(CBFont.body1())
                    .fontWeight(.semibold)
                    .foregroundColor(.cbBlack)
                Spacer()
                Text(ticket.status == "OPEN" ? "Aberto" : "Encerrado")
                    .font(CBFont.caption1())
                    .foregroundColor(ticket.status == "OPEN" ? Color.cbGreen : .cbTextSecondary)
            }
            Text(ticket.message)
                .font(CBFont.body2())
                .foregroundColor(.cbTextSecondary)
                .lineLimit(2)
            Text("#\(ticket.ticketId)")
                .font(CBFont.caption2())
                .foregroundColor(.cbTextSecondary.opacity(0.7))
        }
        .padding(CBSpacing.lg)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: CBRadius.card))
    }
}
