# Guia — Tipo de NF emitida pelo PDV (aba Tipo de NF (PDV))

Explica, em linguagem simples, a aba **Tipo de NF (PDV)** da tela Fiscal.

## O que é

Define **qual documento fiscal o Ponto de Venda (PDV) emite** quando uma venda é concluída:
**NF-e (Modelo 55)** ou **NFC-e (Modelo 65)**. Por lei (8.846), o documento deve ser emitido no
momento da venda — por isso esta configuração existe.

## Onde fica

**Configurações → Fiscal → aba Tipo de NF (PDV)**.

## Como configurar

1. Em **Tipo de NF emitida pelo PDV**, escolha **Modelo 55 - NF-e**, **Modelo 65 - NFC-e** ou
   **Não configurado**.
2. Clique em **Salvar**.

## Regras importantes

- **Modelo 65 (NFC-e) exige CSC**: se o Emitente ainda não tem o CSC cadastrado, o sistema
  **bloqueia** o salvamento e indica ir à aba **Configurações gerais** para cadastrar o CSC.
- **Certificado digital**: se não houver um certificado válido, a tela **avisa** (não bloqueia) —
  você pode salvar a configuração, mas a emissão só funciona depois de enviar o certificado na aba
  **Certificado**.
- **Não configurado**: a venda no PDV é concluída normalmente, porém **sem** documento fiscal.

## "ICMS para Consumidor Final"

Esse controle aparece **desabilitado** ("em breve"): o cálculo de DIFAL não é feito pelo emissor
e não incide na venda de balcão do PDV. É um recurso planejado para o futuro.

## Observação

A emissão em si é feita pelo aplicativo do PDV a partir desta configuração. (A integração do
aplicativo do PDV com a emissão está sendo tratada em uma entrega própria.)
