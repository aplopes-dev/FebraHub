# Quickstart — Validação da Tela Fiscal (Certificado A1)

Pré-requisitos: erp-web (:3107), erp-api (:3114) e fiscal-api (:3116) no ar; usuário com
`fiscal.certificates.manage` e `fiscal.companies.manage`; ambiente **HOMOLOGATION**.

## Cenários

1. **Loja sem Emitente + matriz completa → primeiro upload (US1, SC-001/SC-002)**
   - Ir a `/configuracoes/fiscal` → ver estado vazio "Inserir certificado".
   - Enviar `.pfx` válido + senha correta → Emitente criado automaticamente + certificado vigente aparece **sem recarregar**.

2. **Certificado vigente + histórico (US2, SC-004)**
   - Com ≥2 certificados → vigente em destaque (CNPJ, validade, dias, status); demais em lista somente-leitura, sem "Ativar"/"Excluir".
   - Certificado com `daysUntilExpiration ≤ 30` → badge "vence em breve"; expirado → "vencido".

3. **Substituir (US3)**
   - Enviar novo `.pfx` válido → novo vira vigente; anterior desce ao histórico, sem recarregar.

4. **Famílias de erro (SC-003)** — cada uma produz mensagem distinta e acionável:
   - arquivo/senha ausente (bloqueio client, sem chamar API);
   - arquivo inválido (extensão/tamanho/assinatura);
   - senha incorreta / certificado corrompido/expirado (422);
   - CNPJ do certificado ≠ CNPJ do Emitente (mensagem comparando os dois);
   - provisionamento: matriz sem `cityCodeIbge` resolvível / regime MEI-ISENTO / `platformStoreId` nulo.

5. **Segurança (SC-005)**
   - Após upload: senha não aparece em URL, DevTools→Application (localStorage/sessionStorage), nem no cache do React Query.

6. **Consolidação (SC-006)**
   - A seção "Certificado digital (NF-e)" da aba de uso da empresa não existe mais; no lugar, atalho para `/configuracoes/fiscal`.

## Testes automatizados (Vitest + RTL + MSW)

- estado sem Emitente (provisionamento automático no upload);
- upload com sucesso (reflete vigente);
- cada família de erro → mensagem própria;
- badge de expiração próxima;
- histórico somente-leitura (sem "Ativar"/"Excluir");
- MEI/ISENTO e `platformStoreId` nulo → bloqueio com mensagem.
