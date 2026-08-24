WIKI.register({
  id: 'entrega-frete',
  title: 'Entrega e Frete',
  icon: '🚚',
  searchText: 'entrega frete shipping zonas raio bairros tabela cep ShippingRule taxa prazo delivery',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Catálogo e Operação</div>
    <h1 class="section-title">🚚 Entrega e Frete</h1>
    <p class="section-subtitle">Configuração de zonas de entrega, cálculo de frete e gestão do fluxo de despacho — desde a validação do endereço até a confirmação de entrega.</p>
    <div class="section-tags">
      <span class="tag-orange">Entrega</span>
      <span class="tag-amber">ShippingRule</span>
      <span class="tag-gray">RADIUS · NEIGHBORHOOD · TABLE</span>
    </div>
  </div>

  <div class="blueprint-today">
    <div class="blueprint-today-label">📍 Hoje (MVP)</div>
    <ul>
      <li>ShippingRule: RADIUS (raio em km), NEIGHBORHOOD (lista de bairros), TABLE (faixas de CEP)</li>
      <li>API de cálculo de frete funcional no <code>marketplace-api</code></li>
      <li>Configuração de zonas via vertical food: <code>salon-zones.util.ts</code></li>
      <li>ERP: tela de zonas de entrega em mock</li>
    </ul>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta (Alvo)</div>
    <ul>
      <li>UI visual de zonas no mapa: desenhar área de cobertura via Google Maps/Leaflet</li>
      <li>Frete dinâmico por distância (por km após raio base)</li>
      <li>Frete grátis condicional (valor mínimo de pedido)</li>
      <li>Prazo de entrega por zona com horários de pico</li>
      <li>Integração com apps de entrega: iFood, Loggi, Lalamove API</li>
      <li>Rastreamento de entregador em tempo real no mapa</li>
      <li>SLA de entrega: alertas quando pedido ultrapassa tempo estimado</li>
    </ul>
  </div>

  <h2>Tipos de ShippingRule</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Configuração</th><th>Melhor para</th></tr></thead>
      <tbody>
        <tr>
          <td class="td-bold">RADIUS</td>
          <td>Raio em km, preço fixo ou por km adicional</td>
          <td>Restaurantes, serviços locais</td>
        </tr>
        <tr>
          <td class="td-bold">NEIGHBORHOOD</td>
          <td>Lista de bairros atendidos com taxa por bairro</td>
          <td>Mercados, padarias, farmácias</td>
        </tr>
        <tr>
          <td class="td-bold">TABLE</td>
          <td>Faixas de CEP com taxa e prazo específicos</td>
          <td>E-commerce, grandes regiões</td>
        </tr>
        <tr>
          <td class="td-bold">FREE</td>
          <td>Grátis acima de valor mínimo (proposta)</td>
          <td>Promoções, fidelidade</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>Modelo ShippingRule</h2>
  <pre>model ShippingRule {
  id          String      @id @default(cuid())
  storeId     String
  type        ShippingType // RADIUS | NEIGHBORHOOD | TABLE
  isActive    Boolean     @default(true)
  minOrderValue Decimal?  // pedido mínimo para habilitar entrega
  freeAbove   Decimal?    // frete grátis acima deste valor

  // RADIUS
  radiusKm    Float?
  basePrice   Decimal?
  pricePerKm  Decimal?   // taxa adicional por km extra

  // NEIGHBORHOOD
  neighborhoods NeighborhoodZone[]

  // TABLE
  cepRanges   CepZone[]

  estimatedMinutes Int    @default(45)
}

model NeighborhoodZone {
  id       String @id
  ruleId   String
  name     String  // "Centro", "Jardim América"
  city     String
  state    String
  price    Decimal
  minutes  Int
}</pre>

  <h2>Cálculo de frete (fluxo)</h2>
  <div class="mermaid">
flowchart TD
  Address["Endereço do cliente"] --> Validate["Validar CEP via API"]
  Validate --> Type{Tipo de regra?}
  Type -->|RADIUS| Geo["Calcular distância\nHaversine lat/lon"]
  Type -->|NEIGHBORHOOD| Bairro["Verificar bairro\nna lista de zonas"]
  Type -->|TABLE| CEP["Buscar faixa CEP\nna tabela"]
  Geo --> Check{Dentro da área?}
  Bairro --> Check
  CEP --> Check
  Check -->|Não| NoDelivery["❌ Não entregamos nesta área"]
  Check -->|Sim| CalcFee["Calcular taxa:\nbase + extras"]
  CalcFee --> FreeCheck{Pedido ≥ frete grátis?}
  FreeCheck -->|Sim| Free["Taxa = R$0,00"]
  FreeCheck -->|Não| Fee["Taxa calculada"]
  Free --> Result["✅ Retornar taxa + prazo"]
  Fee --> Result
  </div>

  <h2>Configuração de zonas — UI proposta</h2>
  <div class="card-grid">
    <div class="card card-orange">
      <div class="card-title"><span class="card-icon">🗺️</span> Mapa interativo</div>
      <p>Desenhar raio de cobertura no mapa. Visualização em tempo real dos bairros cobertos com overlay colorido por taxa.</p>
    </div>
    <div class="card card-amber">
      <div class="card-title"><span class="card-icon">📍</span> Múltiplas zonas</div>
      <p>Criar zonas com taxas distintas: "Centro R$3,00 / 30min", "Zona Norte R$6,00 / 50min".</p>
    </div>
    <div class="card card-blue">
      <div class="card-title"><span class="card-icon">⏰</span> Horários de pico</div>
      <p>Taxa de entrega dinâmica: mais cara nos horários de alta demanda (sex/sab 19-22h).</p>
    </div>
  </div>

  <h2>Rastreamento de entregadores (proposta)</h2>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">🎯 Proposta P2</div>
    <ul>
      <li>Entregador instala PWA que envia localização GPS a cada 30s</li>
      <li>ERP exibe mapa com posição do entregador para cada pedido em trânsito</li>
      <li>Cliente recebe link de rastreamento por WhatsApp</li>
      <li>Alerta ao lojista se entregador parou por &gt;10min sem entregar</li>
    </ul>
  </div>
</div>
`
});
