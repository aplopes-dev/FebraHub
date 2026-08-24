<#import "template.ftl" as layout>
<#assign boOrigin = properties.backofficeOrigin!'https://backoffice.citybox.com'>
<#assign ssoUri = boOrigin + '/auth/sso'>
<#assign isBackofficeClient = (client.clientId!'') == 'citybox-backoffice'>
<#if isBackofficeClient>
    <#assign targetUrl = ssoUri>
<#elseif pageRedirectUri?has_content>
    <#assign targetUrl = pageRedirectUri>
<#else>
    <#assign targetUrl = ssoUri>
</#if>
<@layout.registrationLayout displayMessage=false; section>
    <#if section = "header">
        <#if messageHeader??>
            ${kcSanitize(msg("${messageHeader}"))?no_esc}
        <#else>
            ${message.summary}
        </#if>
    <#elseif section = "form">
    <#if targetUrl?has_content>
        <script>
            window.location.replace("${targetUrl?js_string}");
        </script>
    </#if>
    <div id="kc-info-message">
        <p class="instruction">${message.summary}<#if requiredActions??><#list requiredActions>: <b><#items as reqActionItem>${kcSanitize(msg("requiredAction.${reqActionItem}"))?no_esc}<#sep>, </#items></b></#list><#else></#if></p>
        <#if targetUrl?has_content>
            <p class="instruction">${msg("redirectingToBackoffice")}</p>
            <p><a href="${targetUrl}">${msg("backToApplication")}</a></p>
        <#elseif actionUri?has_content>
            <p><a href="${actionUri}">${msg("proceedWithAction")}</a></p>
        <#elseif (client.baseUrl)?has_content>
            <p><a href="${client.baseUrl}">${msg("backToApplication")}</a></p>
        </#if>
    </div>
    </#if>
</@layout.registrationLayout>
