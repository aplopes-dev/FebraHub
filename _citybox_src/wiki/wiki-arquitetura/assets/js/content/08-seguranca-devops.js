WIKI.register({
  id: 'seguranca-devops',
  title: 'Segurança e DevOps',
  icon: '🔐',
  searchText: 'seguranca oauth2 openid connect jwt keycloak resource server access token rbac secrets configuracao centralizada spring cloud config unleash twelve factor devops ci cd github actions gitops argocd docker kubernetes helm terraform iac semantic versioning conventional commits testes testcontainers pact k6',
  html: `
<div class="section-content">
  <div class="section-header">
    <div class="section-breadcrumb">Arquitetura-alvo</div>
    <h1 class="section-title">🔐 Segurança, configuração e DevOps</h1>
    <p class="section-subtitle">Segurança é um ponto forte do Citybox (Keycloak já cobre o "Spring Authorization Server + Spring Security" do curso). DevOps e qualidade automatizada são o gap: hoje deploy por scripts, sem CI/CD nem IaC.</p>
    <div class="section-tags">
      <span class="tag-emerald">Keycloak forte</span>
      <span class="tag-amber">CI/CD gap</span>
      <span class="tag-blue">12-Factor</span>
    </div>
  </div>

  <h2>Segurança — já alinhado ao currículo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tópico do curso</th><th>Citybox</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">OAuth2 / OpenID Connect</td><td>Keycloak 26 (issuer OIDC)</td><td><span class="status-badge status-functional">✅</span></td></tr>
        <tr><td class="td-bold">JWT / Access Token Pattern</td><td>JWT verificado via JWKS (<code>jose</code>) nos guards</td><td><span class="status-badge status-functional">✅</span></td></tr>
        <tr><td class="td-bold">Authorization Server</td><td>Keycloak gerenciado (sync admin via adapters)</td><td><span class="status-badge status-functional">✅</span></td></tr>
        <tr><td class="td-bold">Resource Server</td><td>Guards JWT em <code>@citybox/nest-common</code> + RBAC por roles</td><td><span class="status-badge status-functional">✅</span></td></tr>
        <tr><td class="td-bold">Segurança de API</td><td>helmet, validação <code>class-validator</code>; falta rate limiting</td><td><span class="status-badge status-partial">🔶</span></td></tr>
      </tbody>
    </table>
  </div>

  <h2>Configuração e segredos</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">🔶 Hoje</div>
    <p>Configuração via env vars + <code>@nestjs/config</code>; feature flags via <strong>Unleash</strong>. Segredos vivem em env/compose. Segue parcialmente o 12-Factor (config externalizada), mas sem rotação nem store dedicado.</p>
  </div>
  <div class="blueprint-proposed">
    <div class="blueprint-proposed-label">💡 Alvo</div>
    <ul>
      <li><strong>Config centralizada</strong>: manter env + Unleash (cobre o "Spring Cloud Config" para flags); documentar contrato de env por serviço.</li>
      <li><strong>Secrets</strong>: secret manager (ex.: Doppler/Vault ou AWS Secrets Manager se migrar à AWS); nunca em git.</li>
      <li><strong>Rotação</strong>: rotacionar credenciais de DB/RabbitMQ/Keycloak; reload sem redeploy onde possível.</li>
    </ul>
  </div>

  <h2>DevOps — o gap operacional</h2>
  <div class="blueprint-today">
    <div class="blueprint-today-label">🔶 Hoje</div>
    <p>Sem <code>.github/workflows</code> nem GitLab CI. Deploy por scripts shell (<code>deploy-production.sh</code>) + Docker Compose em VM/host. Sem Terraform/Helm/K8s.</p>
  </div>

  <h2>Pipeline CI/CD alvo</h2>
  <div class="mermaid">
flowchart LR
  PR["Pull Request"] --> CI["CI: build · lint · typecheck · test"]
  CI --> Cov["cobertura + Testcontainers (Postgres real)"]
  Cov --> Sec["scan segredos + deps"]
  Sec --> Img["build imagens citybox-*"]
  Img --> Reg["registry"]
  Reg --> CD["CD: deploy staging"]
  CD --> Smoke["smoke + health checks"]
  Smoke --> Prod["deploy produção (aprovação)"]
  </div>

  <div class="card-grid">
    <div class="card card-emerald">
      <div class="card-title"><span class="card-icon">⚙️</span> CI (P1)</div>
      <p>GitHub Actions: <code>turbo run build lint typecheck test</code> em cada PR. Gate de cobertura (diretriz 80%).</p>
    </div>
    <div class="card card-teal">
      <div class="card-title"><span class="card-icon">🚀</span> CD (P2)</div>
      <p>Build de imagens + deploy automatizado em staging; produção com aprovação manual. Mantém Compose por ora.</p>
    </div>
    <div class="card card-slate">
      <div class="card-title"><span class="card-icon">☸️</span> K8s/IaC (futuro)</div>
      <p>Só se a escala exigir multi-host/auto-scaling. Aí entram Helm + ArgoCD (GitOps) + Terraform — não antes.</p>
    </div>
  </div>

  <h2>Boas práticas de processo</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Prática do curso</th><th>Citybox</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">The Twelve-Factor App</td><td>Config externalizada ✅; melhorar logs como stream e disposability</td></tr>
        <tr><td class="td-bold">Conventional Commits</td><td>Já é diretriz do projeto (<code>feat/fix/refactor…</code>) ✅</td></tr>
        <tr><td class="td-bold">Semantic Versioning</td><td>Versões fixadas via pnpm catalog; aplicar SemVer aos pacotes publicáveis</td></tr>
        <tr><td class="td-bold">GitOps / ArgoCD</td><td>Futuro, condicionado a K8s</td></tr>
      </tbody>
    </table>
  </div>

  <h2>Qualidade automatizada (testes)</h2>
  <div class="table-wrap">
    <table>
      <thead><tr><th>Tipo</th><th>Curso</th><th>Citybox (alvo)</th></tr></thead>
      <tbody>
        <tr><td class="td-bold">Integração com infra real</td><td>Testcontainers</td><td>Testcontainers (Node) p/ Postgres/RabbitMQ reais</td></tr>
        <tr><td class="td-bold">Contrato consumer-driven</td><td>Spring Cloud Contract</td><td>Pact JS entre BFF↔core-api↔payment-api</td></tr>
        <tr><td class="td-bold">Carga</td><td>Grafana k6</td><td>k6 (mesma ferramenta) nos fluxos de checkout/busca</td></tr>
        <tr><td class="td-bold">Unit</td><td>JUnit/Mockito</td><td>node:test + tsx / Vitest ✅</td></tr>
      </tbody>
    </table>
  </div>

  <div class="alert alert-emerald">
    <span class="alert-icon">🔒</span>
    <div class="alert-body">
      <div class="alert-title">Não migre para K8s por status</div>
      <p>O curso ensina Kubernetes/Helm/Rancher porque o público-alvo opera em grande escala. Para o Citybox (cidade única), Compose + CI/CD + observabilidade entregam confiabilidade com fração do custo operacional. K8s só quando houver necessidade real de multi-host e auto-scaling.</p>
    </div>
  </div>
</div>
`
});
