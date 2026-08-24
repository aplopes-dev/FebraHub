<!doctype html>
<html lang="${locale}" dir="${localeDir}" data-theme="warm">
  <head>
    <meta charset="utf-8">
    <link rel="icon" type="${properties.favIconType!'image/svg+xml'}" href="${resourceUrl}${properties.favIcon!'/img/citybox-favicon.svg'}">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <meta name="description" content="${properties.description!'Console para gerenciar seus dados de acesso na plataforma Citybox.'}">
    <title>${properties.title!'Minha conta Citybox'}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      body { margin: 0; }
      body, #app { height: 100%; }
      .container { padding: 0; margin: 0; width: 100%; }
      .keycloak__loading-container {
        height: 100vh;
        width: 100%;
        color: #1a1f2b;
        background-color: #f3f0e8;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        margin: 0;
        font-family: 'Instrument Sans', system-ui, sans-serif;
      }
      .citybox-account-loading-mark {
        display: inline-flex;
        height: 2.75rem;
        width: 2.75rem;
        align-items: center;
        justify-content: center;
        border-radius: 0.75rem;
        background: #f97316;
        color: #fff8f1;
        font-size: 0.85rem;
        font-weight: 700;
        letter-spacing: 0.04em;
      }
      #loading-text {
        z-index: 1000;
        font-size: 1rem;
        font-weight: 500;
        padding-top: 1.25rem;
        color: #5c6474;
      }
      .pf-v5-c-spinner__path { stroke: #f97316; }
    </style>
    <script type="importmap">
      {
        "imports": {
          "react": "${resourceCommonUrl}/vendor/react/react.production.min.js",
          "react/jsx-runtime": "${resourceCommonUrl}/vendor/react/react-jsx-runtime.production.min.js",
          "react-dom": "${resourceCommonUrl}/vendor/react-dom/react-dom.production.min.js"
        }
      }
    </script>
    <#if !isSecureContext>
      <script type="module" src="${resourceCommonUrl}/vendor/web-crypto-shim/web-crypto-shim.js"></script>
    </#if>
    <#if devServerUrl?has_content>
      <script type="module">
        import { injectIntoGlobalHook } from "${devServerUrl}/@react-refresh";
        injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => (type) => type;
      </script>
      <script type="module">
        import { inject } from "${devServerUrl}/@vite-plugin-checker-runtime";
        inject({ overlayConfig: {}, base: "/" });
      </script>
      <script type="module" src="${devServerUrl}/@vite/client"></script>
      <script type="module" src="${devServerUrl}/src/main.tsx"></script>
    </#if>
    <#if entryStyles?has_content>
      <#list entryStyles as style>
        <link rel="stylesheet" href="${resourceUrl}/${style}">
      </#list>
    </#if>
    <#if properties.styles?has_content>
      <#list properties.styles?split(' ') as style>
        <link rel="stylesheet" href="${resourceUrl}/${style}">
      </#list>
    </#if>
    <#if entryScript?has_content>
      <script type="module" src="${resourceUrl}/${entryScript}"></script>
    </#if>
    <#if properties.scripts?has_content>
      <#list properties.scripts?split(' ') as script>
        <script type="module" src="${resourceUrl}/${script}"></script>
      </#list>
    </#if>
    <#if entryImports?has_content>
      <#list entryImports as import>
        <link rel="modulepreload" href="${resourceUrl}/${import}">
      </#list>
    </#if>
  </head>
  <body data-page-id="account" class="citybox-account-body">
    <div id="app">
      <main class="container">
        <div class="keycloak__loading-container">
          <span class="citybox-account-loading-mark" aria-hidden="true">AP</span>
          <svg class="pf-v5-c-spinner pf-m-xl" role="progressbar" aria-valuetext="${msg('accountLoadingMessage')}" viewBox="0 0 100 100" aria-label="${msg('accountLoadingMessage')}">
            <circle class="pf-v5-c-spinner__path" cx="50" cy="50" r="45" fill="none"></circle>
          </svg>
          <div>
            <p id="loading-text">${msg('accountLoadingMessage')}</p>
          </div>
        </div>
      </main>
    </div>
    <noscript>${msg('accountConsoleRequiresJs')}</noscript>
    <script id="environment" type="application/json">
      {
        "serverBaseUrl": "${serverBaseUrl}",
        "authUrl": "${authUrl}",
        "authServerUrl": "${authServerUrl}",
        "realm": "${realm.name}",
        "clientId": "${clientId}",
        "resourceUrl": "${resourceUrl}",
        "logo": "${properties.logo!""}",
        "logoUrl": "${properties.logoUrl!""}",
        "baseUrl": "${baseUrl}",
        "locale": "${locale}",
        "referrerName": "${referrerName!""}",
        "referrerUrl": "${referrer_uri!""}",
        "features": {
          "isRegistrationEmailAsUsername": ${realm.registrationEmailAsUsername?c},
          "isEditUserNameAllowed": ${realm.editUsernameAllowed?c},
          "isInternationalizationEnabled": ${realm.isInternationalizationEnabled()?c},
          "isLinkedAccountsEnabled": ${isLinkedAccountsEnabled?c},
          "isMyResourcesEnabled": ${(realm.userManagedAccessAllowed && isAuthorizationEnabled)?c},
          "isViewOrganizationsEnabled": ${isViewOrganizationsEnabled?c},
          "deleteAccountAllowed": ${deleteAccountAllowed?c},
          "updateEmailFeatureEnabled": ${updateEmailFeatureEnabled?c},
          "updateEmailActionEnabled": ${updateEmailActionEnabled?c},
          "isViewGroupsEnabled": ${isViewGroupsEnabled?c},
          "isOid4VciEnabled": ${isOid4VciEnabled?c}
        },
        "scope": "${scope!""}"
      }
    </script>
  </body>
</html>
