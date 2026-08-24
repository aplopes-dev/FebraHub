<#import "field.ftl" as field>
<#import "footer.ftl" as loginFooter>
<#macro username>
  <#assign label>
    <#if !realm.loginWithEmailAllowed>${msg("username")}<#elseif !realm.registrationEmailAsUsername>${msg("usernameOrEmail")}<#else>${msg("email")}</#if>
  </#assign>
  <@field.group name="username" label=label>
    <div class="${properties.kcInputGroup}">
      <div class="${properties.kcInputGroupItemClass} ${properties.kcFill}">
        <span class="${properties.kcInputClass} ${properties.kcFormReadOnlyClass}">
          <input id="kc-attempted-username" value="${auth.attemptedUsername}" readonly>
        </span>
      </div>
      <div class="${properties.kcInputGroupItemClass}">
        <button id="reset-login" class="${properties.kcFormPasswordVisibilityButtonClass} kc-login-tooltip" type="button"
              aria-label="${msg('restartLoginTooltip')}" onclick="location.href='${url.loginRestartFlowUrl?js_string}'">
            <i class="fa-sync-alt fas" aria-hidden="true"></i>
            <span class="kc-tooltip-text">${msg("restartLoginTooltip")}</span>
        </button>
      </div>
    </div>
  </@field.group>
</#macro>

<#macro registrationLayout bodyClass="" displayInfo=false displayMessage=true displayRequiredFields=false>
<!DOCTYPE html>
<html class="${properties.kcHtmlClass!}" lang="pt-BR" data-theme="warm">

<head>
    <meta charset="utf-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="color-scheme" content="light">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${msg("loginTitle", realm.displayName!'')}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <#if properties.stylesCommon?has_content>
        <#list properties.stylesCommon?split(' ') as style>
            <link href="${url.resourcesCommonPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <#if properties.styles?has_content>
        <#list properties.styles?split(' ') as style>
            <link href="${url.resourcesPath}/${style}" rel="stylesheet" />
        </#list>
    </#if>
    <script type="importmap">
        {
            "imports": {
                "rfc4648": "${url.resourcesCommonPath}/vendor/rfc4648/rfc4648.js"
            }
        }
    </script>
    <#if properties.scripts?has_content>
        <#list properties.scripts?split(' ') as script>
            <script src="${url.resourcesPath}/${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <#if scripts??>
        <#list scripts as script>
            <script src="${script}" type="text/javascript"></script>
        </#list>
    </#if>
    <script type="module" src="${url.resourcesPath}/js/passwordVisibility.js"></script>
    <script type="module">
        <#outputformat "JavaScript">
        import { startSessionPolling } from "${url.resourcesPath}/js/authChecker.js";
        startSessionPolling(${url.ssoLoginInOtherTabsUrl?c});
        </#outputformat>
    </script>
    <script type="module">
        document.addEventListener("click", (event) => {
            const link = event.target.closest("a[data-once-link]");
            if (!link) return;
            if (link.getAttribute("aria-disabled") === "true") {
                event.preventDefault();
                return;
            }
            const { disabledClass } = link.dataset;
            if (disabledClass) {
                link.classList.add(...disabledClass.trim().split(/\s+/));
            }
            link.setAttribute("role", "link");
            link.setAttribute("aria-disabled", "true");
        });
    </script>
    <#if authenticationSession??>
        <script type="module">
             <#outputformat "JavaScript">
            import { checkAuthSession } from "${url.resourcesPath}/js/authChecker.js";
            checkAuthSession(${authenticationSession.authSessionIdHash?c});
            </#outputformat>
        </script>
    </#if>
</head>

<body id="keycloak-bg" class="${properties.kcBodyClass!}" data-page-id="login-${pageId}">
  <a class="citybox-skip-link" href="#citybox-auth-main">${msg("skipToContent")}</a>
  <div class="citybox-auth-shell">
    <section class="citybox-auth-hero" aria-hidden="true">
      <span class="citybox-auth-badge">Backoffice lojista</span>
      <h1 class="citybox-auth-headline">ERP da sua loja, em um só lugar.</h1>
      <p class="citybox-auth-lead">
        Login único para lojistas e equipes autorizadas na plataforma Citybox.
      </p>
    </section>

    <div class="citybox-auth-panel">
      <div class="${properties.kcLogin!}">
        <div class="${properties.kcLoginContainer!} citybox-login-container">
          <main id="citybox-auth-main" class="${properties.kcLoginMain!} citybox-login-card" tabindex="-1">
            <div class="${properties.kcLoginMainHeader!} citybox-login-card-header">
              <div class="citybox-page-title" id="kc-page-title"><#nested "header"></div>
            </div>

            <div class="${properties.kcLoginMainBody!}">
              <#if !(auth?has_content && auth.showUsername() && !auth.showResetCredentials())>
                  <#if displayRequiredFields>
                      <div class="${properties.kcContentWrapperClass!}">
                          <div class="${properties.kcLabelWrapperClass!} subtitle">
                              <span class="${properties.kcInputHelperTextItemTextClass!}">
                                <span class="${properties.kcInputRequiredClass!}">*</span> ${msg("requiredFields")}
                              </span>
                          </div>
                      </div>
                  </#if>
              <#else>
                  <#if displayRequiredFields>
                      <div class="${properties.kcFormClass} ${properties.kcContentWrapperClass}">
                          <#nested "show-username">
                          <@username />
                      </div>
                  <#else>
                      <div class="${properties.kcFormClass} ${properties.kcContentWrapperClass}">
                        <#nested "show-username">
                        <@username />
                      </div>
                  </#if>
              </#if>

              <#if displayMessage && message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                  <div class="${properties.kcAlertClass!} pf-m-${(message.type = 'error')?then('danger', message.type)} citybox-alert">
                      <div class="${properties.kcAlertIconClass!}">
                          <#if message.type = 'success'><span class="${properties.kcFeedbackSuccessIcon!}"></span></#if>
                          <#if message.type = 'warning'><span class="${properties.kcFeedbackWarningIcon!}"></span></#if>
                          <#if message.type = 'error'><span class="${properties.kcFeedbackErrorIcon!}"></span></#if>
                          <#if message.type = 'info'><span class="${properties.kcFeedbackInfoIcon!}"></span></#if>
                      </div>
                      <span class="${properties.kcAlertTitleClass!} kc-feedback-text">${message.summary}</span>
                  </div>
              </#if>

              <#nested "form">

              <#if auth?has_content && auth.showTryAnotherWayLink()>
                <form id="kc-select-try-another-way-form" action="${url.loginAction}" method="post" novalidate="novalidate">
                    <input type="hidden" name="tryAnotherWay" value="on"/>
                    <a id="try-another-way" href="javascript:document.forms['kc-select-try-another-way-form'].requestSubmit()"
                        class="${properties.kcButtonSecondaryClass} ${properties.kcButtonBlockClass} ${properties.kcMarginTopClass}">
                          ${msg("doTryAnotherWay")}
                    </a>
                </form>
              </#if>

              <div class="${properties.kcLoginMainFooter!}">
                  <#nested "socialProviders">
                  <#if displayInfo>
                      <div id="kc-info" class="${properties.kcLoginMainFooterBand!} ${properties.kcFormClass}">
                          <div id="kc-info-wrapper" class="${properties.kcLoginMainFooterBandItem!}">
                              <#nested "info">
                          </div>
                      </div>
                  </#if>
              </div>
            </div>

            <div class="${properties.kcLoginMainFooter!}">
                <@loginFooter.content/>
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
</#macro>
