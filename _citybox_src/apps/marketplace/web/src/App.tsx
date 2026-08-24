import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import { ToastProvider } from '@/components/shared/toast';
import { AppShell } from '@/components/layout/app-shell';
import { HomePage } from '@/pages/HomePage';
import { SearchPage } from '@/pages/SearchPage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { ConfirmationPage } from '@/pages/ConfirmationPage';
import { AccountPage } from '@/pages/AccountPage';
import { FavoritesPage } from '@/pages/FavoritesPage';
import { OrdersPage } from '@/pages/OrdersPage';
import {
  AddressFormPage,
  AddressListPage,
  CardFormPage,
  EditProfilePage,
  PaymentMethodsPage,
  SettingsPage,
  SubscriptionPage,
} from '@/pages/account/AccountSubPages';
import { CouponsPage, ShippingOptionsPage } from '@/pages/purchase/PurchaseFlowPages';
import {
  OrderDetailPage,
  ReturnPage,
  TrackingPage,
  WriteReviewPage,
} from '@/pages/orders/PostPurchasePages';
import { CategoryPage, ReviewsPage } from '@/pages/discovery/DiscoveryPages';
import {
  ChatPage,
  HelpPage,
  MyTicketsPage,
  NotificationsPage,
  OpenTicketPage,
} from '@/pages/engagement/EngagementPages';
import {
  ForgotPasswordPage,
  LoginPage,
  OnboardingPage,
  RegisterPage,
  ResetPasswordPage,
  SplashPage,
} from '@/pages/auth/AuthPages';
import { ContentPageView } from '@/pages/ContentPages';
import { useAuth } from '@/context/AppContext';

function AppRoutes() {
  const { isLoggedIn, hasSeenOnboarding } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashPage onFinished={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="/pagina/:slug"
          element={
            <ContentPageView
              backTo="/login"
              className="min-h-screen bg-surface px-4 py-6 md:px-8 md:py-10"
            />
          }
        />
        <Route path="/login" element={hasSeenOnboarding ? <LoginPage /> : <Navigate to="/onboarding" replace />} />
        <Route path="/onboarding" element={hasSeenOnboarding ? <Navigate to="/login" replace /> : <OnboardingPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />
        <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
        <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to={hasSeenOnboarding ? '/login' : '/onboarding'} replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="busca" element={<SearchPage />} />
        <Route path="categoria/:categoryId" element={<CategoryPage />} />
        <Route path="produto/:id" element={<ProductPage />} />
        <Route path="produto/:id/avaliacoes" element={<ReviewsPage />} />
        <Route path="carrinho" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="checkout/endereco" element={<AddressListPage selectionMode />} />
        <Route path="checkout/envio" element={<ShippingOptionsPage />} />
        <Route path="conta/cupons" element={<CouponsPage />} />
        <Route path="confirmacao" element={<ConfirmationPage />} />
        <Route path="compras" element={<OrdersPage />} />
        <Route path="compras/:orderId" element={<OrderDetailPage />} />
        <Route path="compras/:orderId/rastreio" element={<TrackingPage />} />
        <Route path="compras/:orderId/devolucao" element={<ReturnPage />} />
        <Route path="avaliar/:productId" element={<WriteReviewPage />} />
        <Route path="conta" element={<AccountPage />} />
        <Route path="conta/perfil" element={<EditProfilePage />} />
        <Route path="conta/enderecos" element={<AddressListPage />} />
        <Route path="conta/enderecos/novo" element={<AddressFormPage />} />
        <Route path="conta/enderecos/:id" element={<AddressFormPage />} />
        <Route path="conta/cartoes" element={<PaymentMethodsPage />} />
        <Route path="conta/cartoes/novo" element={<CardFormPage />} />
        <Route path="conta/configuracoes" element={<SettingsPage />} />
        <Route path="conta/citybox-plus" element={<SubscriptionPage />} />
        <Route path="conta/notificacoes" element={<NotificationsPage />} />
        <Route path="conta/ajuda" element={<HelpPage />} />
        <Route path="conta/chamado" element={<OpenTicketPage />} />
        <Route path="conta/chamados" element={<MyTicketsPage />} />
        <Route path="conta/atendimento" element={<ChatPage />} />
        <Route path="pagina/:slug" element={<ContentPageView />} />
        <Route path="favoritos" element={<FavoritesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
