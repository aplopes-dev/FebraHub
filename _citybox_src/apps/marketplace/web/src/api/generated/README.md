# @citybox/api-client@1.0.0

A TypeScript SDK client for the 127.0.0.1 API.

## Usage

First, install the SDK from npm.

```bash
npm install @citybox/api-client --save
```

Next, try it out.


```ts
import {
  Configuration,
  AssinaturaApi,
} from '@citybox/api-client';
import type { CancelSubscriptionOperationRequest } from '@citybox/api-client';

async function example() {
  console.log("🚀 Testing @citybox/api-client SDK...");
  const config = new Configuration({ 
    // Configure HTTP bearer authorization: bearerAuth
    accessToken: "YOUR BEARER TOKEN",
  });
  const api = new AssinaturaApi(config);

  const body = {
    // CancelSubscriptionRequest (optional)
    cancelSubscriptionRequest: ...,
  } satisfies CancelSubscriptionOperationRequest;

  try {
    const data = await api.cancelSubscription(body);
    console.log(data);
  } catch (error) {
    console.error(error);
  }
}

// Run the test
example().catch(console.error);
```


## Documentation

### API Endpoints

All URIs are relative to *http://127.0.0.1:4010*

| Class | Method | HTTP request | Description
| ----- | ------ | ------------ | -------------
*AssinaturaApi* | [**cancelSubscription**](docs/AssinaturaApi.md#cancelsubscriptionoperation) | **POST** /me/subscription/cancel | Cancelar assinatura (B8)
*AssinaturaApi* | [**getSubscription**](docs/AssinaturaApi.md#getsubscription) | **GET** /me/subscription | Assinatura CityBox+ (B8)
*AuthApi* | [**forgotPassword**](docs/AuthApi.md#forgotpasswordoperation) | **POST** /auth/forgot-password | Solicitar redefinição de senha (A2)
*AuthApi* | [**getSession**](docs/AuthApi.md#getsession) | **GET** /auth/session | Restaurar sessão (Splash → auto-login)
*AuthApi* | [**login**](docs/AuthApi.md#loginoperation) | **POST** /auth/login | Login com e-mail/telefone e senha
*AuthApi* | [**loginGoogle**](docs/AuthApi.md#logingoogleoperation) | **POST** /auth/google | Login com Google (A1)
*AuthApi* | [**logout**](docs/AuthApi.md#logoutoperation) | **POST** /auth/logout | Logout
*AuthApi* | [**onboardingPostLogin**](docs/AuthApi.md#onboardingpostloginoperation) | **PATCH** /me/onboarding | Sincronizar onboarding (pós-login, A3)
*AuthApi* | [**onboardingPreLogin**](docs/AuthApi.md#onboardingpreloginoperation) | **POST** /auth/onboarding | Marcar onboarding visto (pré-login, A3)
*AuthApi* | [**refreshToken**](docs/AuthApi.md#refreshtoken) | **POST** /auth/refresh | Renovar access token
*AuthApi* | [**register**](docs/AuthApi.md#registeroperation) | **POST** /auth/register | Criar conta (A1)
*AuthApi* | [**resetPassword**](docs/AuthApi.md#resetpasswordoperation) | **POST** /auth/reset-password | Redefinir senha via token do e-mail (A2)
*CarrinhoApi* | [**addCartItem**](docs/CarrinhoApi.md#addcartitemoperation) | **POST** /me/cart/items | Adicionar item ao carrinho
*CarrinhoApi* | [**applyCartCoupon**](docs/CarrinhoApi.md#applycartcouponoperation) | **POST** /me/cart/coupon | Aplicar cupom via carrinho (alias)
*CarrinhoApi* | [**clearCart**](docs/CarrinhoApi.md#clearcart) | **DELETE** /me/cart | Limpar carrinho
*CarrinhoApi* | [**getCart**](docs/CarrinhoApi.md#getcart) | **GET** /me/cart | Obter carrinho (+ badge)
*CarrinhoApi* | [**removeCartItem**](docs/CarrinhoApi.md#removecartitem) | **DELETE** /me/cart/items/{productId} | Remover item
*CarrinhoApi* | [**updateCartItem**](docs/CarrinhoApi.md#updatecartitemoperation) | **PATCH** /me/cart/items/{productId} | Atualizar quantidade (0 remove)
*CatalogoApi* | [**addReviewPhoto**](docs/CatalogoApi.md#addreviewphoto) | **POST** /catalog/products/{productId}/reviews/{reviewId}/photos | Anexar foto a avaliação (D3)
*CatalogoApi* | [**addSearchHistory**](docs/CatalogoApi.md#addsearchhistoryoperation) | **POST** /me/search-history | Registrar busca (E4)
*CatalogoApi* | [**clearSearchHistory**](docs/CatalogoApi.md#clearsearchhistory) | **DELETE** /me/search-history | Limpar histórico (E4)
*CatalogoApi* | [**createReview**](docs/CatalogoApi.md#createreviewoperation) | **POST** /catalog/products/{productId}/reviews | Escrever avaliação (D3)
*CatalogoApi* | [**getCategoryProducts**](docs/CatalogoApi.md#getcategoryproducts) | **GET** /catalog/categories/{categoryId}/products | Produtos por categoria (E1)
*CatalogoApi* | [**getFiltersMetadata**](docs/CatalogoApi.md#getfiltersmetadata) | **GET** /catalog/filters/metadata | Metadados de filtros (E2)
*CatalogoApi* | [**getHome**](docs/CatalogoApi.md#gethome) | **GET** /catalog/home | Feed da Home (seções pré-montadas)
*CatalogoApi* | [**getProduct**](docs/CatalogoApi.md#getproduct) | **GET** /catalog/products/{productId} | Detalhe do produto (PDP)
*CatalogoApi* | [**getReviews**](docs/CatalogoApi.md#getreviews) | **GET** /catalog/products/{productId}/reviews | Avaliações do produto (E3)
*CatalogoApi* | [**getSearchHistory**](docs/CatalogoApi.md#getsearchhistory) | **GET** /me/search-history | Histórico de busca (E4)
*CatalogoApi* | [**listCategories**](docs/CatalogoApi.md#listcategories) | **GET** /catalog/categories | Listar categorias (E1)
*CatalogoApi* | [**searchProducts**](docs/CatalogoApi.md#searchproducts) | **GET** /catalog/search | Busca de produtos (E2/E4)
*CatalogoApi* | [**searchSuggestions**](docs/CatalogoApi.md#searchsuggestions) | **GET** /catalog/search/suggestions | Sugestões de busca (E4)
*CheckoutApi* | [**checkoutPreview**](docs/CheckoutApi.md#checkoutpreviewoperation) | **POST** /checkout/preview | Resumo do checkout sem persistir
*CheckoutApi* | [**createOrder**](docs/CheckoutApi.md#createorderoperation) | **POST** /checkout/orders | Confirmar pedido (C4/C5)
*CheckoutApi* | [**getCheckoutSession**](docs/CheckoutApi.md#getcheckoutsession) | **GET** /checkout/session | Obter sessão de checkout
*CheckoutApi* | [**getShippingOptions**](docs/CheckoutApi.md#getshippingoptionsoperation) | **POST** /checkout/shipping-options | Cotar opções de envio (C2)
*CheckoutApi* | [**listCoupons**](docs/CheckoutApi.md#listcoupons) | **GET** /me/coupons | Cupons disponíveis (C3)
*CheckoutApi* | [**removeCoupon**](docs/CheckoutApi.md#removecoupon) | **DELETE** /checkout/coupons | Remover cupom aplicado (C3)
*CheckoutApi* | [**updateCheckoutSession**](docs/CheckoutApi.md#updatecheckoutsessionoperation) | **PATCH** /checkout/session | Atualizar sessão (endereço/envio/pagamento)
*CheckoutApi* | [**validateCoupon**](docs/CheckoutApi.md#validatecouponoperation) | **POST** /checkout/coupons/validate | Validar/aplicar cupom (C3)
*ConteudoApi* | [**getBanners**](docs/ConteudoApi.md#getbanners) | **GET** /content/banners | Banners promocionais (Home)
*ConteudoApi* | [**getHealth**](docs/ConteudoApi.md#gethealth) | **GET** /health | Health check
*ConteudoApi* | [**getRoot**](docs/ConteudoApi.md#getroot) | **GET** / | Raiz do mock local (smoke test)
*ConteudoApi* | [**getStaticPage**](docs/ConteudoApi.md#getstaticpage) | **GET** /content/pages/{slug} | Página estática (B7)
*EnderecosApi* | [**createAddress**](docs/EnderecosApi.md#createaddress) | **POST** /me/addresses | Criar endereço (B3)
*EnderecosApi* | [**deleteAddress**](docs/EnderecosApi.md#deleteaddress) | **DELETE** /me/addresses/{addressId} | Excluir endereço (B2)
*EnderecosApi* | [**listAddresses**](docs/EnderecosApi.md#listaddresses) | **GET** /me/addresses | Listar endereços (B2)
*EnderecosApi* | [**lookupZip**](docs/EnderecosApi.md#lookupzip) | **GET** /addresses/zip/{zipCode} | Busca por CEP (B3)
*EnderecosApi* | [**setDefaultAddress**](docs/EnderecosApi.md#setdefaultaddress) | **PATCH** /me/addresses/{addressId}/default | Definir endereço padrão (B2/C1)
*EnderecosApi* | [**updateAddress**](docs/EnderecosApi.md#updateaddress) | **PUT** /me/addresses/{addressId} | Editar endereço (B3)
*EngajamentoApi* | [**createTicket**](docs/EngajamentoApi.md#createticketoperation) | **POST** /me/support/tickets | Abrir ticket de suporte (F3 alt)
*EngajamentoApi* | [**getChatMessages**](docs/EngajamentoApi.md#getchatmessages) | **GET** /me/support/chat/messages | Histórico do chat (F3)
*EngajamentoApi* | [**getFaq**](docs/EngajamentoApi.md#getfaq) | **GET** /support/faq | FAQ / Ajuda (F2)
*EngajamentoApi* | [**listNotifications**](docs/EngajamentoApi.md#listnotifications) | **GET** /me/notifications | Listar notificações (F1)
*EngajamentoApi* | [**markAllNotificationsRead**](docs/EngajamentoApi.md#markallnotificationsread) | **POST** /me/notifications/read-all | Marcar todas como lidas (F1)
*EngajamentoApi* | [**markNotificationRead**](docs/EngajamentoApi.md#marknotificationread) | **PATCH** /me/notifications/{notificationId}/read | Marcar notificação como lida (F1)
*EngajamentoApi* | [**sendChatMessage**](docs/EngajamentoApi.md#sendchatmessageoperation) | **POST** /me/support/chat/messages | Enviar mensagem ao chat (F3)
*FavoritosApi* | [**listFavorites**](docs/FavoritosApi.md#listfavorites) | **GET** /me/favorites | Listar favoritos
*FavoritosApi* | [**toggleFavorite**](docs/FavoritosApi.md#togglefavoriteoperation) | **PUT** /me/favorites/{productId} | Toggle favorito
*PagamentosApi* | [**createPaymentMethod**](docs/PagamentosApi.md#createpaymentmethodoperation) | **POST** /me/payment-methods | Adicionar cartão (B5)
*PagamentosApi* | [**deletePaymentMethod**](docs/PagamentosApi.md#deletepaymentmethod) | **DELETE** /me/payment-methods/{paymentMethodId} | Excluir cartão (B4)
*PagamentosApi* | [**listPaymentMethods**](docs/PagamentosApi.md#listpaymentmethods) | **GET** /me/payment-methods | Listar cartões (B4)
*PagamentosApi* | [**setDefaultPaymentMethod**](docs/PagamentosApi.md#setdefaultpaymentmethod) | **PATCH** /me/payment-methods/{paymentMethodId}/default | Definir cartão padrão (B4/C5)
*PedidosApi* | [**buyAgain**](docs/PedidosApi.md#buyagain) | **POST** /me/orders/{orderId}/buy-again | Comprar novamente (D1)
*PedidosApi* | [**cancelOrder**](docs/PedidosApi.md#cancelorderoperation) | **POST** /me/orders/{orderId}/cancel | Cancelar pedido (D1/D4)
*PedidosApi* | [**createReturn**](docs/PedidosApi.md#createreturnoperation) | **POST** /me/orders/{orderId}/returns | Solicitar devolução (D4)
*PedidosApi* | [**getInvoice**](docs/PedidosApi.md#getinvoice) | **GET** /me/orders/{orderId}/invoice | Nota fiscal (D1)
*PedidosApi* | [**getOrder**](docs/PedidosApi.md#getorder) | **GET** /me/orders/{orderId} | Detalhe do pedido (D1)
*PedidosApi* | [**getReturn**](docs/PedidosApi.md#getreturn) | **GET** /me/orders/{orderId}/returns/{returnId} | Consultar devolução (D4)
*PedidosApi* | [**getTracking**](docs/PedidosApi.md#gettracking) | **GET** /me/orders/{orderId}/tracking | Rastreamento (D2)
*PedidosApi* | [**listOrders**](docs/PedidosApi.md#listorders) | **GET** /me/orders | Listar pedidos
*PerfilApi* | [**deleteAccount**](docs/PerfilApi.md#deleteaccountoperation) | **DELETE** /me | Excluir conta (B6)
*PerfilApi* | [**getMe**](docs/PerfilApi.md#getme) | **GET** /me | Obter perfil (B1)
*PerfilApi* | [**getSettings**](docs/PerfilApi.md#getsettings) | **GET** /me/settings | Obter configurações (B6)
*PerfilApi* | [**updateMe**](docs/PerfilApi.md#updatemeoperation) | **PATCH** /me | Editar perfil (B1)
*PerfilApi* | [**updateSettings**](docs/PerfilApi.md#updatesettings) | **PATCH** /me/settings | Atualizar configurações (B6)
*PerfilApi* | [**uploadAvatar**](docs/PerfilApi.md#uploadavatar) | **POST** /me/avatar | Upload de avatar (B1)


### Models

- [AddCartItemRequest](docs/AddCartItemRequest.md)
- [AddReviewPhoto201Response](docs/AddReviewPhoto201Response.md)
- [AddReviewPhoto201ResponseData](docs/AddReviewPhoto201ResponseData.md)
- [AddSearchHistoryRequest](docs/AddSearchHistoryRequest.md)
- [Address](docs/Address.md)
- [AddressEnvelope](docs/AddressEnvelope.md)
- [AddressEnvelopeData](docs/AddressEnvelopeData.md)
- [AddressInput](docs/AddressInput.md)
- [AppliedCoupon](docs/AppliedCoupon.md)
- [ApplyCartCoupon200Response](docs/ApplyCartCoupon200Response.md)
- [ApplyCartCoupon200ResponseData](docs/ApplyCartCoupon200ResponseData.md)
- [ApplyCartCouponRequest](docs/ApplyCartCouponRequest.md)
- [AuthEnvelope](docs/AuthEnvelope.md)
- [AuthEnvelopeData](docs/AuthEnvelopeData.md)
- [BuyAgain200Response](docs/BuyAgain200Response.md)
- [BuyAgain200ResponseData](docs/BuyAgain200ResponseData.md)
- [CancelOrderRequest](docs/CancelOrderRequest.md)
- [CancelSubscription200Response](docs/CancelSubscription200Response.md)
- [CancelSubscription200ResponseData](docs/CancelSubscription200ResponseData.md)
- [CancelSubscriptionRequest](docs/CancelSubscriptionRequest.md)
- [CardBrand](docs/CardBrand.md)
- [Cart](docs/Cart.md)
- [CartItem](docs/CartItem.md)
- [CartItemInput](docs/CartItemInput.md)
- [CartShippingPreview](docs/CartShippingPreview.md)
- [Category](docs/Category.md)
- [ChatMessage](docs/ChatMessage.md)
- [CheckoutPreview](docs/CheckoutPreview.md)
- [CheckoutPreview200Response](docs/CheckoutPreview200Response.md)
- [CheckoutPreview200ResponseData](docs/CheckoutPreview200ResponseData.md)
- [CheckoutPreview200ResponseDataAllOfInstallmentOptionsInner](docs/CheckoutPreview200ResponseDataAllOfInstallmentOptionsInner.md)
- [CheckoutPreviewRequest](docs/CheckoutPreviewRequest.md)
- [CheckoutSession](docs/CheckoutSession.md)
- [CheckoutSessionEnvelope](docs/CheckoutSessionEnvelope.md)
- [CheckoutSessionEnvelopeData](docs/CheckoutSessionEnvelopeData.md)
- [Coupon](docs/Coupon.md)
- [CouponType](docs/CouponType.md)
- [CreateOrder201Response](docs/CreateOrder201Response.md)
- [CreateOrder201ResponseData](docs/CreateOrder201ResponseData.md)
- [CreateOrderRequest](docs/CreateOrderRequest.md)
- [CreatePaymentMethod201Response](docs/CreatePaymentMethod201Response.md)
- [CreatePaymentMethod201ResponseData](docs/CreatePaymentMethod201ResponseData.md)
- [CreatePaymentMethodRequest](docs/CreatePaymentMethodRequest.md)
- [CreateReturn201Response](docs/CreateReturn201Response.md)
- [CreateReturn201ResponseData](docs/CreateReturn201ResponseData.md)
- [CreateReturnRequest](docs/CreateReturnRequest.md)
- [CreateReview201Response](docs/CreateReview201Response.md)
- [CreateReview201ResponseData](docs/CreateReview201ResponseData.md)
- [CreateReviewRequest](docs/CreateReviewRequest.md)
- [CreateTicket201Response](docs/CreateTicket201Response.md)
- [CreateTicket201ResponseData](docs/CreateTicket201ResponseData.md)
- [CreateTicketRequest](docs/CreateTicketRequest.md)
- [DeleteAccountRequest](docs/DeleteAccountRequest.md)
- [ErrorEnvelope](docs/ErrorEnvelope.md)
- [ErrorEnvelopeErrorsInner](docs/ErrorEnvelopeErrorsInner.md)
- [FaqItem](docs/FaqItem.md)
- [ForgotPasswordEnvelope](docs/ForgotPasswordEnvelope.md)
- [ForgotPasswordEnvelopeData](docs/ForgotPasswordEnvelopeData.md)
- [ForgotPasswordRequest](docs/ForgotPasswordRequest.md)
- [GetBanners200Response](docs/GetBanners200Response.md)
- [GetBanners200ResponseData](docs/GetBanners200ResponseData.md)
- [GetBanners200ResponseDataBannersInner](docs/GetBanners200ResponseDataBannersInner.md)
- [GetBanners200ResponseDataBannersInnerAction](docs/GetBanners200ResponseDataBannersInnerAction.md)
- [GetCart200Response](docs/GetCart200Response.md)
- [GetCategoryProducts200Response](docs/GetCategoryProducts200Response.md)
- [GetCategoryProducts200ResponseData](docs/GetCategoryProducts200ResponseData.md)
- [GetChatMessages200Response](docs/GetChatMessages200Response.md)
- [GetChatMessages200ResponseData](docs/GetChatMessages200ResponseData.md)
- [GetFaq200Response](docs/GetFaq200Response.md)
- [GetFaq200ResponseData](docs/GetFaq200ResponseData.md)
- [GetFiltersMetadata200Response](docs/GetFiltersMetadata200Response.md)
- [GetFiltersMetadata200ResponseData](docs/GetFiltersMetadata200ResponseData.md)
- [GetFiltersMetadata200ResponseDataFlagsInner](docs/GetFiltersMetadata200ResponseDataFlagsInner.md)
- [GetFiltersMetadata200ResponseDataPriceRange](docs/GetFiltersMetadata200ResponseDataPriceRange.md)
- [GetFiltersMetadata200ResponseDataSortOptionsInner](docs/GetFiltersMetadata200ResponseDataSortOptionsInner.md)
- [GetHome200Response](docs/GetHome200Response.md)
- [GetHome200ResponseData](docs/GetHome200ResponseData.md)
- [GetHome200ResponseDataSectionsInner](docs/GetHome200ResponseDataSectionsInner.md)
- [GetInvoice200Response](docs/GetInvoice200Response.md)
- [GetInvoice200ResponseData](docs/GetInvoice200ResponseData.md)
- [GetMe200Response](docs/GetMe200Response.md)
- [GetMe200ResponseData](docs/GetMe200ResponseData.md)
- [GetOrder200Response](docs/GetOrder200Response.md)
- [GetOrder200ResponseData](docs/GetOrder200ResponseData.md)
- [GetProduct200Response](docs/GetProduct200Response.md)
- [GetProduct200ResponseData](docs/GetProduct200ResponseData.md)
- [GetReturn200Response](docs/GetReturn200Response.md)
- [GetReviews200Response](docs/GetReviews200Response.md)
- [GetReviews200ResponseData](docs/GetReviews200ResponseData.md)
- [GetSettings200Response](docs/GetSettings200Response.md)
- [GetShippingOptions200Response](docs/GetShippingOptions200Response.md)
- [GetShippingOptions200ResponseData](docs/GetShippingOptions200ResponseData.md)
- [GetShippingOptionsRequest](docs/GetShippingOptionsRequest.md)
- [GetStaticPage200Response](docs/GetStaticPage200Response.md)
- [GetStaticPage200ResponseData](docs/GetStaticPage200ResponseData.md)
- [GetSubscription200Response](docs/GetSubscription200Response.md)
- [GetTracking200Response](docs/GetTracking200Response.md)
- [HealthResponse](docs/HealthResponse.md)
- [ListAddresses200Response](docs/ListAddresses200Response.md)
- [ListAddresses200ResponseData](docs/ListAddresses200ResponseData.md)
- [ListCategories200Response](docs/ListCategories200Response.md)
- [ListCategories200ResponseData](docs/ListCategories200ResponseData.md)
- [ListCoupons200Response](docs/ListCoupons200Response.md)
- [ListCoupons200ResponseData](docs/ListCoupons200ResponseData.md)
- [ListFavorites200Response](docs/ListFavorites200Response.md)
- [ListFavorites200ResponseData](docs/ListFavorites200ResponseData.md)
- [ListNotifications200Response](docs/ListNotifications200Response.md)
- [ListNotifications200ResponseData](docs/ListNotifications200ResponseData.md)
- [ListOrders200Response](docs/ListOrders200Response.md)
- [ListOrders200ResponseData](docs/ListOrders200ResponseData.md)
- [ListPaymentMethods200Response](docs/ListPaymentMethods200Response.md)
- [ListPaymentMethods200ResponseData](docs/ListPaymentMethods200ResponseData.md)
- [LoginGoogleRequest](docs/LoginGoogleRequest.md)
- [LoginRequest](docs/LoginRequest.md)
- [LogoutRequest](docs/LogoutRequest.md)
- [LookupZip200Response](docs/LookupZip200Response.md)
- [LookupZip200ResponseData](docs/LookupZip200ResponseData.md)
- [MarkAllNotificationsRead200Response](docs/MarkAllNotificationsRead200Response.md)
- [MarkAllNotificationsRead200ResponseData](docs/MarkAllNotificationsRead200ResponseData.md)
- [MarkNotificationRead200Response](docs/MarkNotificationRead200Response.md)
- [MarkNotificationRead200ResponseData](docs/MarkNotificationRead200ResponseData.md)
- [MessageEnvelope](docs/MessageEnvelope.md)
- [MessageEnvelopeData](docs/MessageEnvelopeData.md)
- [MockRootResponse](docs/MockRootResponse.md)
- [Notification](docs/Notification.md)
- [OnboardingEnvelope](docs/OnboardingEnvelope.md)
- [OnboardingEnvelopeData](docs/OnboardingEnvelopeData.md)
- [OnboardingPostLoginRequest](docs/OnboardingPostLoginRequest.md)
- [OnboardingPreLoginRequest](docs/OnboardingPreLoginRequest.md)
- [Order](docs/Order.md)
- [OrderItem](docs/OrderItem.md)
- [OrderPaymentMethod](docs/OrderPaymentMethod.md)
- [OrderStatus](docs/OrderStatus.md)
- [OrderStatusEntry](docs/OrderStatusEntry.md)
- [PageMeta](docs/PageMeta.md)
- [PaymentInput](docs/PaymentInput.md)
- [PaymentMethod](docs/PaymentMethod.md)
- [PaymentResult](docs/PaymentResult.md)
- [PaymentType](docs/PaymentType.md)
- [Product](docs/Product.md)
- [RefreshToken200Response](docs/RefreshToken200Response.md)
- [RefreshToken200ResponseData](docs/RefreshToken200ResponseData.md)
- [RegisterRequest](docs/RegisterRequest.md)
- [RemoveCoupon200Response](docs/RemoveCoupon200Response.md)
- [RemoveCoupon200ResponseData](docs/RemoveCoupon200ResponseData.md)
- [ResetPasswordRequest](docs/ResetPasswordRequest.md)
- [ReturnDetail](docs/ReturnDetail.md)
- [ReturnReason](docs/ReturnReason.md)
- [Review](docs/Review.md)
- [SearchHistoryEnvelope](docs/SearchHistoryEnvelope.md)
- [SearchHistoryEnvelopeData](docs/SearchHistoryEnvelopeData.md)
- [SearchProducts200Response](docs/SearchProducts200Response.md)
- [SearchProducts200ResponseData](docs/SearchProducts200ResponseData.md)
- [SearchSuggestions200Response](docs/SearchSuggestions200Response.md)
- [SearchSuggestions200ResponseData](docs/SearchSuggestions200ResponseData.md)
- [SendChatMessage201Response](docs/SendChatMessage201Response.md)
- [SendChatMessage201ResponseData](docs/SendChatMessage201ResponseData.md)
- [SendChatMessageRequest](docs/SendChatMessageRequest.md)
- [SessionEnvelope](docs/SessionEnvelope.md)
- [SessionEnvelopeData](docs/SessionEnvelopeData.md)
- [SetDefaultPaymentMethod200Response](docs/SetDefaultPaymentMethod200Response.md)
- [SetDefaultPaymentMethod200ResponseData](docs/SetDefaultPaymentMethod200ResponseData.md)
- [Settings](docs/Settings.md)
- [ShippingOption](docs/ShippingOption.md)
- [SortOption](docs/SortOption.md)
- [Subscription](docs/Subscription.md)
- [ToggleFavorite200Response](docs/ToggleFavorite200Response.md)
- [ToggleFavorite200ResponseData](docs/ToggleFavorite200ResponseData.md)
- [ToggleFavoriteRequest](docs/ToggleFavoriteRequest.md)
- [Tracking](docs/Tracking.md)
- [TrackingTimelineInner](docs/TrackingTimelineInner.md)
- [UpdateCartItemRequest](docs/UpdateCartItemRequest.md)
- [UpdateCheckoutSessionRequest](docs/UpdateCheckoutSessionRequest.md)
- [UpdateMeRequest](docs/UpdateMeRequest.md)
- [UploadAvatar200Response](docs/UploadAvatar200Response.md)
- [UploadAvatar200ResponseData](docs/UploadAvatar200ResponseData.md)
- [User](docs/User.md)
- [ValidateCoupon200Response](docs/ValidateCoupon200Response.md)
- [ValidateCoupon200ResponseData](docs/ValidateCoupon200ResponseData.md)
- [ValidateCouponRequest](docs/ValidateCouponRequest.md)

### Authorization


Authentication schemes defined for the API:
<a id="bearerAuth"></a>
#### bearerAuth


- **Type**: HTTP Bearer Token authentication (JWT)

## About

This TypeScript SDK client supports the [Fetch API](https://fetch.spec.whatwg.org/)
and is automatically generated by the
[OpenAPI Generator](https://openapi-generator.tech) project:

- API version: `1.0.0`
- Package version: `1.0.0`
- Generator version: `7.23.0`
- Build package: `org.openapitools.codegen.languages.TypeScriptFetchClientCodegen`

The generated npm module supports the following:

- Environments
  * Node.js
  * Webpack
  * Browserify
- Language levels
  * ES5 - you must have a Promises/A+ library installed
  * ES6
- Module systems
  * CommonJS
  * ES6 module system


## Development

### Building

To build the TypeScript source code, you need to have Node.js and npm installed.
After cloning the repository, navigate to the project directory and run:

```bash
npm install
npm run build
```

### Publishing

Once you've built the package, you can publish it to npm:

```bash
npm publish
```

## License

[Proprietary — © CityBox](https://citybox.com.br/licenca)
