WIKI.register({
  id: 'devices',
  title: 'Devices e Periféricos',
  icon: '📱',
  searchText: 'devices perifericos smartpos impressora KDS pairing WebUSB QR code terminal fiscal',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Devices e Realtime</div>
    <h1 class="section-title">📱 Devices e Periféricos</h1>
    <p class="section-subtitle">Gerenciamento de dispositivos físicos vinculados à loja — PDV, KDS, SmartPOS, impressoras fiscais e de cupom, com pairing por QR Code e protocolo WebUSB.</p>
    <div class="section-tags">
      <span class="tag-orange">Devices</span>
      <span class="tag-amber">SmartPOS · KDS · Impressoras</span>
      <span class="tag-gray">WebUSB · QR Pairing</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>Sem módulo de gestão de devices implementado</li>
      <li>Impressão manual via browser print dialog</li>
      <li>KDS não implementado (placeholder no ERP)</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>Registry de devices por loja: cadastro, nome, tipo, status</li>
      <li>Pairing via QR Code: escanear no device para associar à loja</li>
      <li>WebUSB para impressoras USB (Chrome/Edge): impressão direta sem driver</li>
      <li>Impressão ESC/POS para impressoras térmicas de cupom</li>
      <li>KDS: display de produção vinculado à loja e a estações específicas</li>
      <li>Status online/offline de cada device em tempo real</li>
      <li>Configuração por device: copies, formato, corte automático</li>
    </ul>
  </div>

  <h2>Tipos de device suportados</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Função</th><th>Protocolo</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">SmartPOS (Android)</td><td>PDV completo — app nativo ou PWA</td><td>REST + WebSocket</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Tablet/iPad</td><td>PDV ou KDS via browser</td><td>PWA + WebSocket</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
        <tr><td class="td-bold">KDS (monitor cozinha)</td><td>Display de pedidos em produção</td><td>WebSocket push</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Impressora Térmica USB</td><td>Cupom não-fiscal ESC/POS</td><td>WebUSB</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Impressora Rede (LAN)</td><td>Cupom via TCP/IP socket</td><td>TCP LAN</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Terminal SAT/CF-e</td><td>Emissão fiscal SP (alternativa NFC-e)</td><td>SDK Java</td><td><span class="status-badge status-proposed">💡 Proposta</span></td></tr>
        <tr><td class="td-bold">Leitor de Código de Barras</td><td>Busca de produto no PDV</td><td>HID (teclado virtual)</td><td><span class="status-badge status-partial">🔶 Parcial</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Fluxo de pairing por QR Code</h2>
  <div class="mermaid">
sequenceDiagram
  participant Manager as Gerente (ERP)
  participant DeviceApp as Device (app/browser)
  participant API as vertical-api

  Manager->>API: POST /devices/pairing-token { storeId, type: "KDS" }
  API-->>Manager: { token, qrCodeUrl, expiresAt: 5min }
  Manager->>Manager: Exibe QR Code na tela do ERP

  DeviceApp->>DeviceApp: Abre câmera, escaneia QR
  DeviceApp->>API: POST /devices/pair { token, deviceName, fcmToken }
  API->>API: Valida token + TTL
  API->>DB: INSERT Device { storeId, type, name, fcmToken }
  API-->>DeviceApp: 201 { deviceId, wsToken }
  DeviceApp->>DeviceApp: Conecta WebSocket com wsToken
  Manager->>Manager: Device aparece como "Online" na lista
  </div>

  <h2>Modelo Device</h2>
  <pre>model Device {
  id          String      @id @default(cuid())
  storeId     String
  type        DeviceType  // PDV | KDS | PRINTER | SCANNER | SMARTPOS
  name        String      // "Caixa 1", "KDS Cozinha", "Impressora Balcão"
  fcmToken    String?     // Firebase token para push
  wsToken     String?     // Token WebSocket autenticado
  lastSeenAt  DateTime?
  isOnline    Boolean     @default(false)
  settings    Json?       // { copies: 1, autoCut: true, fontSize: 'normal' }
  createdAt   DateTime    @default(now())
}

enum DeviceType {
  PDV SMARTPOS KDS PRINTER_THERMAL PRINTER_NETWORK SCANNER CUSTOMER_DISPLAY
}</pre>

  <h2>Impressão ESC/POS via WebUSB</h2>
  <pre>// Conectar impressora USB via WebUSB API
async function connectPrinter() {
  const device = await navigator.usb.requestDevice({
    filters: [{ classCode: 7 }] // Printer class
  });
  await device.open();
  await device.claimInterface(0);
  return device;
}

// Enviar comandos ESC/POS
async function printReceipt(device, order) {
  const encoder = new EscPosEncoder();
  const data = encoder
    .initialize()
    .align('center')
    .bold(true).text('CITYBOX').bold(false)
    .newline()
    .text(\`Pedido #\${order.number}\`)
    .newline()
    .table(order.items.map(i =&gt; [i.name, i.qty, formatCurrency(i.price)]))
    .line('-'.repeat(32))
    .text(\`TOTAL: \${formatCurrency(order.total)}\`)
    .cut()
    .encode();

  await device.transferOut(1, data);
}</pre>

  <h2>KDS — Display de Produção</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">👨‍🍳</span> Colunas por status</div>
      <p>Pedidos novos / em produção / prontos — organizados por tempo. Cards ficam vermelhos quando ultrapassam SLA.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">🔊</span> Alerta sonoro</div>
      <p>Novo pedido toca alerta configurável. Volume e som ajustáveis por device.</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">📍</span> Estações múltiplas</div>
      <p>KDS da chapa recebe só itens quentes; KDS da montagem recebe todos. Filtro por tag de produção.</p>
    </div>
  </div>
</div>
`
});
