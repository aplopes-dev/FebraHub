import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthField, AuthFormScaffold, AuthPageShell } from '@/components/auth/auth-primitives';
import { Logo, BrandMark } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/context/AppContext';
import { useLayout } from '@/hooks/useLayout';
import { MOCK_RESET_TOKEN } from '@/data/mock';
import { screenLabel, translateError } from '@/i18n';
import { ApiError } from '@/api/http';
import { cityboxApi } from '@/api/citybox-api';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

const ONBOARDING_SLIDE_KEYS = ['shop', 'deals', 'tracking'] as const;
const ONBOARDING_EMOJIS = ['🛍️', '⚡', '📦'] as const;

export function SplashPage({ onFinished }: { onFinished: () => void }) {
  const [logoScale, setLogoScale] = useState(0.55);
  const [logoOpacity, setLogoOpacity] = useState(0);
  const [glowOpacity, setGlowOpacity] = useState(0);
  const [screenOpacity, setScreenOpacity] = useState(1);

  useEffect(() => {
    const t1 = window.setTimeout(() => {
      setGlowOpacity(1);
      setLogoOpacity(1);
      setLogoScale(1);
    }, 50);

    const t2 = window.setTimeout(() => {
      setScreenOpacity(0);
    }, 1750);

    const t3 = window.setTimeout(onFinished, 2130);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onFinished]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111111] transition-opacity duration-[380ms]"
      style={{ opacity: screenOpacity }}
      data-screen-label={screenLabel('splash')}
    >
      <div
        className="pointer-events-none absolute size-[260px] rounded-full transition-all duration-[550ms] ease-out md:size-[320px]"
        style={{
          opacity: glowOpacity,
          background:
            'radial-gradient(circle, rgba(0,166,80,0.32) 0%, rgba(0,166,80,0.07) 45%, transparent 70%)',
        }}
      />
      <div
        className="relative transition-all duration-[720ms] ease-out"
        style={{ opacity: logoOpacity, transform: `scale(${logoScale})` }}
      >
        <Logo size={128} />
      </div>
    </div>
  );
}

export function OnboardingPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { completeOnboarding } = useAuth();
  const { isMobile } = useLayout();
  const [page, setPage] = useState(0);

  const onboardingSlides = useMemo(
    () =>
      ONBOARDING_SLIDE_KEYS.map((key, index) => ({
        emoji: ONBOARDING_EMOJIS[index],
        title: t(`onboarding.slides.${key}.title`),
        subtitle: t(`onboarding.slides.${key}.subtitle`),
      })),
    [t],
  );

  const slide = onboardingSlides[page];
  const isLast = page === onboardingSlides.length - 1;

  const finish = () => {
    completeOnboarding();
    navigate(routes.login, { replace: true });
  };

  const content = (
    <>
      <div className={cn('flex justify-end', isMobile ? 'pt-14' : 'pt-0')}>
        <button type="button" className="cursor-pointer text-sm text-white/70" onClick={finish}>
          {t('onboarding.skip')}
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 text-center">
        <span className="text-[clamp(56px,10vw,72px)]">{slide.emoji}</span>
        <h2 className="text-[clamp(22px,4vw,28px)] font-extrabold">{slide.title}</h2>
        <p className="max-w-md text-[15px] leading-relaxed text-white/70">{slide.subtitle}</p>
      </div>

      <div className="mb-4 flex justify-center gap-2">
        {onboardingSlides.map((_, index) => (
          <span
            key={index}
            className="rounded-full transition-all"
            style={{
              width: page === index ? 10 : 8,
              height: page === index ? 10 : 8,
              background: page === index ? 'var(--brand)' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>

      <Button
        className="mb-8 h-[50px] w-full rounded-lg bg-brand text-base font-bold text-white hover:bg-brand/90 md:mb-0"
        onClick={() => (isLast ? finish() : setPage((p) => p + 1))}
      >
        {isLast ? t('onboarding.start') : t('onboarding.next')}
      </Button>
    </>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-[#111111] px-[26px] text-white" data-screen-label={screenLabel('onboarding')}>
        {content}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-[#111111] px-6 py-10 text-white"
      data-screen-label={screenLabel('onboarding')}
    >
      <div className="flex w-full max-w-[480px] flex-col rounded-2xl border border-white/10 bg-[#1a1a1a] p-8 shadow-2xl md:min-h-[520px]">
        {content}
      </div>
    </div>
  );
}

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const { isMobile } = useLayout();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleMessage, setGoogleMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    const error = await login(account, password);
    if (error) {
      setErrorMessage(error);
      return;
    }
    navigate(routes.home, { replace: true });
  };

  const handleGoogle = async () => {
    const error = await loginWithGoogle();
    if (error) {
      setErrorMessage(error);
      return;
    }
    setGoogleMessage(t('login.googleConnected'));
    window.setTimeout(() => navigate(routes.home, { replace: true }), 600);
  };

  const form = (
    <>
      <div className="mb-9 flex items-center justify-center gap-4">
        <BrandMark logoSize={isMobile ? 68 : 56} />
      </div>

      <h1 className="mb-6 text-[25px] font-extrabold text-white">{t('login.greeting')}</h1>

      <div className="flex flex-col gap-3">
        <AuthField
          type="email"
          placeholder={t('login.placeholderEmail')}
          value={account}
          onChange={(e) => {
            setAccount(e.target.value);
            setErrorMessage(null);
          }}
        />
        <AuthField
          type="password"
          placeholder={t('login.placeholderPassword')}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrorMessage(null);
          }}
        />

        {errorMessage && <p className="text-xs text-[#ff8a80]">{translateError(errorMessage)}</p>}
        {googleMessage && <p className="text-xs font-semibold text-white">{googleMessage}</p>}

        <button
          type="button"
          className="cursor-pointer self-end text-xs font-semibold text-white/85 hover:text-white"
          onClick={() => navigate(routes.forgotPassword)}
        >
          {t('login.forgotPassword')}
        </button>

        <Button
          className="h-[50px] w-full rounded-lg bg-white text-base font-bold text-[#111111] hover:bg-white/90"
          onClick={handleLogin}
        >
          {t('login.continue')}
        </Button>

        <Button
          variant="outline"
          className="h-[50px] w-full rounded-lg border-0 bg-white/12 text-base font-bold text-white hover:bg-white/20"
          onClick={() => navigate(routes.register)}
        >
          {t('login.createAccount')}
        </Button>

        <div className="flex items-center gap-3 py-6">
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-[13px] text-white/50">{t('common:or')}</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <Button
          variant="outline"
          className="h-12 w-full rounded-lg border border-black/18 bg-white text-[15px] font-semibold text-black/80 hover:bg-white/95"
          onClick={handleGoogle}
        >
          <span className="mr-2.5 text-base font-extrabold text-[#4285F4]">G</span>
          {t('login.continueWithGoogle')}
        </Button>
      </div>
    </>
  );

  const footer = (
    <p className="px-[26px] pb-7 pt-4 text-center text-[11px] leading-relaxed text-white/70 md:px-0 md:pb-0 md:pt-0">
      {t('login.footerPrefix')}{' '}
      <Link to={routes.staticPage('termos')} className="font-semibold text-white underline-offset-2 hover:underline">
        {t('login.footerTerms')}
      </Link>{' '}
      {t('login.footerAnd')}{' '}
      <Link to={routes.staticPage('privacidade')} className="font-semibold text-white underline-offset-2 hover:underline">
        {t('login.footerPrivacy')}
      </Link>{' '}
      {t('login.footerSuffix')}
    </p>
  );

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-[#111111] text-white" data-screen-label={screenLabel('login')}>
        <div className="flex-1 overflow-y-auto px-[26px] pt-[72px]">{form}</div>
        {footer}
      </div>
    );
  }

  return (
    <div data-screen-label={screenLabel('login')}>
      <AuthPageShell footer={footer}>
        {form}
      </AuthPageShell>
    </div>
  );
}

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!acceptedTerms) {
      setErrorMessage(t('register.acceptTermsError'));
      return;
    }
    const error = await register(name, email, phone, password, confirmPassword);
    if (error) {
      setErrorMessage(error);
      return;
    }
    navigate(routes.home, { replace: true });
  };

  return (
    <div data-screen-label={screenLabel('register')}>
      <AuthFormScaffold title={t('register.title')} onBack={() => navigate(routes.login)}>
        <AuthField placeholder={t('register.placeholderName')} value={name} onChange={(e) => setName(e.target.value)} />
        <AuthField type="email" placeholder={t('register.placeholderEmail')} value={email} onChange={(e) => setEmail(e.target.value)} />
        <AuthField type="tel" placeholder={t('register.placeholderPhone')} value={phone} onChange={(e) => setPhone(e.target.value)} />
        <AuthField type="password" placeholder={t('register.placeholderPassword')} value={password} onChange={(e) => setPassword(e.target.value)} />
        <AuthField
          type="password"
          placeholder={t('register.placeholderConfirmPassword')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-white/85">
          <Checkbox
            checked={acceptedTerms}
            onCheckedChange={(v) => setAcceptedTerms(v === true)}
            className="mt-0.5 border-white/70 bg-transparent data-checked:border-white data-checked:bg-white data-checked:text-[#111]"
          />
          <span>
            {t('register.acceptTermsPrefix')}{' '}
            <Link to={routes.staticPage('termos')} className="font-semibold text-white underline-offset-2 hover:underline">
              {t('register.acceptTermsLink')}
            </Link>
          </span>
        </label>

        {errorMessage && <p className="text-xs text-[#ff8a80]">{translateError(errorMessage)}</p>}

        <Button
          className="mt-2 h-[50px] w-full rounded-lg bg-white text-base font-bold text-[#111111] hover:bg-white/90"
          onClick={handleRegister}
          disabled={!name || !email || !password}
        >
          {t('register.submit')}
        </Button>

        <button
          type="button"
          className="cursor-pointer pt-2 text-center text-sm font-semibold text-white/85 hover:text-white"
          onClick={() => navigate(routes.login)}
        >
          {t('register.alreadyHaveAccount')}
        </button>
      </AuthFormScaffold>
    </div>
  );
}

export function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <div data-screen-label={screenLabel('forgotPassword')}>
      <AuthFormScaffold title={t('forgotPassword.title')} onBack={() => navigate(routes.login)}>
        {sent ? (
          <>
            <p className="text-lg font-bold text-brand">{t('forgotPassword.emailSent')}</p>
            <p className="text-sm text-white/70">
              {t('forgotPassword.emailSentBody', { email })}
            </p>
            <Button
              className="mt-2 h-[50px] w-full rounded-lg bg-brand text-base font-bold text-white hover:bg-brand/90"
              onClick={() => navigate(routes.login)}
            >
              {t('forgotPassword.backToLogin')}
            </Button>
            <Button
              variant="outline"
              className="h-[50px] w-full rounded-lg border border-white/20 bg-transparent text-base font-bold text-white hover:bg-white/10"
              onClick={() =>
                navigate(`${routes.resetPassword}?token=${encodeURIComponent(MOCK_RESET_TOKEN)}`)
              }
            >
              {t('forgotPassword.resetPassword')}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-white/70">{t('forgotPassword.description')}</p>
            <AuthField
              type="email"
              placeholder={t('forgotPassword.placeholderEmail')}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrorMessage(null);
              }}
            />
            {errorMessage && <p className="text-xs text-destructive">{translateError(errorMessage)}</p>}
            <Button
              className="mt-2 h-[50px] w-full rounded-lg bg-brand text-base font-bold text-white hover:bg-brand/90"
              onClick={() => {
                if (!email.trim() || !email.includes('@')) {
                  setErrorMessage(t('forgotPassword.invalidEmail'));
                  return;
                }
                setSent(true);
              }}
              disabled={!email.trim()}
            >
              {t('forgotPassword.sendLink')}
            </Button>
          </>
        )}
      </AuthFormScaffold>
    </div>
  );
}

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => navigate(routes.login, { replace: true }), 1200);
    return () => window.clearTimeout(timer);
  }, [success, navigate]);

  const handleReset = async () => {
    if (!token.trim()) {
      setErrorMessage(t('resetPassword.invalidLink'));
      return;
    }
    if (!password || !confirmPassword) {
      setErrorMessage(t('resetPassword.requiredField'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t('resetPassword.passwordsMismatch'));
      return;
    }
    if (password.length < 4) {
      setErrorMessage(t('resetPassword.passwordTooShort'));
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    try {
      await cityboxApi.resetPassword({
        token,
        password,
        confirmPassword,
      });
      setSuccess(true);
    } catch (e) {
      if (e instanceof ApiError) {
        setErrorMessage(e.message);
      } else {
        setErrorMessage(t('resetPassword.resetFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-screen-label={screenLabel('resetPassword')}>
      <AuthFormScaffold title={t('resetPassword.title')} onBack={() => navigate(routes.login)}>
        {success ? (
          <>
            <p className="text-lg font-bold text-brand">{t('resetPassword.successTitle')}</p>
            <p className="text-sm text-white/70">{t('resetPassword.successRedirect')}</p>
          </>
        ) : (
          <>
            <p className="text-sm text-white/70">{t('resetPassword.description')}</p>
            <AuthField
              type="password"
              placeholder={t('resetPassword.placeholderNewPassword')}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage(null);
              }}
            />
            <AuthField
              type="password"
              placeholder={t('resetPassword.placeholderConfirmPassword')}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage(null);
              }}
            />
            {errorMessage && <p className="text-xs text-destructive">{translateError(errorMessage)}</p>}
            <Button
              className="mt-2 h-[50px] w-full rounded-lg bg-brand text-base font-bold text-white hover:bg-brand/90"
              onClick={handleReset}
              disabled={!password || !confirmPassword || submitting}
            >
              {t('resetPassword.submit')}
            </Button>
          </>
        )}
      </AuthFormScaffold>
    </div>
  );
}
