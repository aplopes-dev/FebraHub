import { useRef, useState } from 'react';
import { screenLabel } from '@/i18n';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Check, Trash2 } from 'lucide-react';
import { cityboxApi } from '@/api/citybox-api';
import { SubscriptionPlanBanner } from '@/components/account/account-components';
import { mapSubscription } from '@/api/mappers';
import { useAuth, useCheckout } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { PanelCard, TwoColumnLayout } from '@/components/shared/layout-primitives';
import { useLayout } from '@/hooks/useLayout';
import { useAsyncData } from '@/hooks/useAsyncData';
import { FormActions, FormField, FormInput, SubPageLayout } from '@/components/shared/sub-page-layout';
import { useToast } from '@/components/shared/toast';
import { routes } from '@/lib/routes';
import { formatAddressLine1, formatAddressLine2 } from '@/types';

export function EditProfilePage() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { show } = useToast();
  const { user, updateProfile, isLoggedIn } = useAuth();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (file: File) => {
    if (!isLoggedIn) {
      setAvatarUrl(URL.createObjectURL(file));
      return;
    }
    setUploadingAvatar(true);
    try {
      const { avatarUrl: url } = await cityboxApi.uploadAvatar(file);
      setAvatarUrl(url);
    } catch {
      show(t('profile.uploadFailed'), 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div data-screen-label={screenLabel('editProfile')}>
      <SubPageLayout title={t('profile.title')} backTo={routes.account} width="narrow">
        <PanelCard className="flex flex-col items-center gap-5 p-6">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatarChange(file);
            }}
          />
          <button
            type="button"
            className="relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-brand text-3xl font-extrabold text-brand-foreground"
            disabled={uploadingAvatar}
            onClick={() => avatarInputRef.current?.click()}
            aria-label={t('common:aria.changePhoto')}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="size-full object-cover" />
            ) : (
              user.avatarInitial
            )}
            <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/45 py-0.5">
              <Camera className="size-4 text-white" />
            </span>
          </button>
          <span className="text-xs text-muted-foreground">
            {uploadingAvatar ? t('common:sendingPhoto') : t('profile.tapToChangePhoto')}
          </span>
          <div className="grid w-full gap-4">
            <FormField label={t('profile.labelName')}>
              <FormInput value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField label={t('profile.labelEmail')}>
              <FormInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
            <FormField label={t('profile.labelPhone')}>
              <FormInput value={phone} onChange={(e) => setPhone(e.target.value)} />
            </FormField>
          </div>
          <FormActions>
            <Button
              className="h-12 w-full rounded-lg text-base font-bold"
              onClick={() => {
                updateProfile(name, email, phone);
                navigate(routes.account);
              }}
            >
              {t('common:save')}
            </Button>
          </FormActions>
        </PanelCard>
      </SubPageLayout>
    </div>
  );
}

export function AddressListPage({ selectionMode = false }: { selectionMode?: boolean }) {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { addresses, selectAddress, removeAddress, selectedAddress } = useCheckout();
  const backTo = selectionMode ? routes.checkout : routes.account;

  return (
    <div data-screen-label={screenLabel('addresses')}>
      <SubPageLayout title={selectionMode ? t('addresses.selectTitle') : t('addresses.title')} backTo={backTo}>
        <div className="flex flex-col gap-3">
          {addresses.map((addr) => {
            const selectThisAddress = () => {
              selectAddress(addr.id);
              navigate(routes.checkout);
            };
            return (
            <PanelCard
              key={addr.id}
              className="cursor-pointer p-4"
              role={selectionMode ? 'button' : undefined}
              tabIndex={selectionMode ? 0 : undefined}
              onClick={selectionMode ? selectThisAddress : undefined}
              onKeyDown={
                selectionMode
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectThisAddress();
                      }
                    }
                  : undefined
              }
            >
              <div className="flex items-start gap-3">
                {selectionMode && (
                  <input
                    type="radio"
                    checked={selectedAddress?.id === addr.id}
                    readOnly
                    className="mt-1"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{addr.label}</span>
                    {addr.isDefault && (
                      <span className="rounded bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
                        {t('common:default')}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-sm">{formatAddressLine1(addr)}</div>
                  <div className="text-[13px] text-muted-foreground">{formatAddressLine2(addr)}</div>
                </div>
                {!selectionMode && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      className="cursor-pointer px-2 py-1 text-xs font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(routes.editAddress(addr.id));
                      }}
                    >
                      {t('common:edit')}
                    </button>
                    <button
                      type="button"
                      className="cursor-pointer px-2 py-1 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAddress(addr.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                )}
              </div>
            </PanelCard>
            );
          })}
          <Button
            variant="outline"
            className="h-12 rounded-lg font-bold"
            onClick={() => navigate(routes.newAddress + (selectionMode ? '?modo=selecao' : ''))}
          >
            {t('addresses.add')}
          </Button>
        </div>
      </SubPageLayout>
    </div>
  );
}

export function AddressFormPage() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const selectionMode = searchParams.get('modo') === 'selecao';
  const editId = id && id !== 'novo' ? id : null;
  const { addresses, addAddress, editAddress } = useCheckout();
  const existing = editId ? addresses.find((a) => a.id === editId) : null;

  const [label, setLabel] = useState(existing?.label ?? t('common:labels.home'));
  const [zipCode, setZipCode] = useState(existing?.zipCode ?? '');
  const [street, setStreet] = useState(existing?.street ?? '');
  const [number, setNumber] = useState(existing?.number ?? '');
  const [complement, setComplement] = useState(existing?.complement ?? '');
  const [neighborhood, setNeighborhood] = useState(existing?.neighborhood ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [state, setState] = useState(existing?.state ?? 'SP');
  const [isDefault, setIsDefault] = useState(existing?.isDefault ?? false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const lookupCep = async () => {
    const digits = zipCode.replace(/\D/g, '');
    if (digits.length !== 8) {
      setCepError(t('addresses.invalidZip'));
      return;
    }
    setCepError(null);
    setCepLoading(true);
    try {
      const data = await cityboxApi.lookupZip(digits);
      setStreet(data.street);
      setNeighborhood(data.neighborhood);
      setCity(data.city);
      setState(data.state);
    } catch {
      setCepError(t('addresses.zipNotFound'));
    } finally {
      setCepLoading(false);
    }
  };

  const save = () => {
    const addr = {
      id: existing?.id ?? `addr-${Date.now()}`,
      label,
      zipCode,
      street,
      number,
      complement,
      neighborhood,
      city,
      state,
      isDefault,
    };
    if (existing) editAddress(addr);
    else addAddress(addr);
    navigate(selectionMode ? routes.checkoutAddress : routes.addresses);
  };

  return (
    <div data-screen-label={screenLabel('addressForm')}>
      <SubPageLayout title={existing ? t('addresses.editTitle') : t('addresses.addTitle')} backTo={selectionMode ? routes.checkoutAddress : routes.addresses} width="narrow">
        <PanelCard className="grid gap-4 p-5">
          <FormField label={t('addresses.labelNickname')}>
            <FormInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder={t('addresses.placeholderNickname')} />
          </FormField>
          <FormField label={t('addresses.labelZipCode')}>
            <div className="flex gap-2">
              <FormInput
                value={zipCode}
                onChange={(e) => {
                  setZipCode(e.target.value);
                  setCepError(null);
                }}
                placeholder={t('addresses.placeholderZipCode')}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => void lookupCep()}
                disabled={cepLoading}
              >
                {cepLoading ? t('common:searching') : t('addresses.lookup')}
              </Button>
            </div>
            {cepError && <p className="mt-1 text-xs text-destructive">{cepError}</p>}
          </FormField>
          <FormField label={t('addresses.labelStreet')}>
            <FormInput value={street} onChange={(e) => setStreet(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('addresses.labelNumber')}>
              <FormInput value={number} onChange={(e) => setNumber(e.target.value)} />
            </FormField>
            <FormField label={t('addresses.labelComplement')}>
              <FormInput value={complement} onChange={(e) => setComplement(e.target.value)} />
            </FormField>
          </div>
          <FormField label={t('addresses.labelNeighborhood')}>
            <FormInput value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('addresses.labelCity')}>
              <FormInput value={city} onChange={(e) => setCity(e.target.value)} />
            </FormField>
            <FormField label={t('addresses.labelState')}>
              <FormInput value={state} onChange={(e) => setState(e.target.value)} maxLength={2} />
            </FormField>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            {t('addresses.setDefault')}
          </label>
          <Button className="h-12 w-full rounded-lg font-bold" onClick={save}>
            {t('common:save')}
          </Button>
        </PanelCard>
      </SubPageLayout>
    </div>
  );
}

export function PaymentMethodsPage() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { paymentMethods, removePaymentMethod, selectPayment, selectedPayment } = useCheckout();

  return (
    <div data-screen-label={screenLabel('cards')}>
      <SubPageLayout title={t('cards.title')} backTo={routes.account}>
        <div className="flex flex-col gap-3">
          {paymentMethods.map((pm) => (
            <PanelCard key={pm.id} className="flex items-center gap-3 p-4">
              <span className="text-2xl">💳</span>
              <div className="min-w-0 flex-1">
                <div className="font-bold">
                  {pm.brand} ****{pm.lastFour}
                </div>
                <div className="text-[13px] text-muted-foreground">
                  {pm.holderName} · {t('cards.expiryLabel', { expiry: pm.expiry })}
                  {pm.isDefault && ` · ${t('common:default')}`}
                </div>
              </div>
              <button
                type="button"
                className="cursor-pointer text-xs font-bold"
                onClick={() => selectPayment(pm.id)}
              >
                {selectedPayment?.id === pm.id ? t('common:selected') : t('common:use')}
              </button>
              <button type="button" className="cursor-pointer text-destructive" onClick={() => removePaymentMethod(pm.id)}>
                <Trash2 className="size-4" />
              </button>
            </PanelCard>
          ))}
          <Button variant="outline" className="h-12 rounded-lg font-bold" onClick={() => navigate(routes.newCard)}>
            {t('cards.add')}
          </Button>
        </div>
      </SubPageLayout>
    </div>
  );
}

function detectBrand(num: string): 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'UNKNOWN' {
  if (num.startsWith('4')) return 'VISA';
  if (num.startsWith('5')) return 'MASTERCARD';
  if (num.startsWith('6')) return 'ELO';
  if (num.startsWith('3')) return 'AMEX';
  return 'UNKNOWN';
}

export function CardFormPage() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnToCheckout = searchParams.get('retorno') === 'checkout';
  const { addPaymentMethod, selectPayment } = useCheckout();
  const [number, setNumber] = useState('');
  const [holder, setHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const brand = detectBrand(number.replace(/\D/g, ''));

  return (
    <div data-screen-label={screenLabel('addCard')}>
      <SubPageLayout title={t('cards.formTitle')} backTo={returnToCheckout ? routes.checkout : routes.cards} width="narrow">
        <PanelCard className="grid gap-4 p-5">
          <FormField label={t('cards.labelNumber')}>
            <FormInput value={number} onChange={(e) => setNumber(e.target.value)} placeholder={t('cards.placeholderNumber')} />
            {number && <span className="text-xs text-muted-foreground">{t('cards.detectedBrand', { brand })}</span>}
          </FormField>
          <FormField label={t('cards.labelHolder')}>
            <FormInput value={holder} onChange={(e) => setHolder(e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={t('cards.labelExpiry')}>
              <FormInput value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder={t('cards.placeholderExpiry')} />
            </FormField>
            <FormField label={t('cards.labelCvv')}>
              <FormInput value={cvv} onChange={(e) => setCvv(e.target.value)} placeholder={t('cards.placeholderCvv')} maxLength={4} />
            </FormField>
          </div>
          <Button
            className="h-12 w-full rounded-lg font-bold"
            onClick={() => {
              const digits = number.replace(/\D/g, '');
              const id = `card-${Date.now()}`;
              addPaymentMethod({
                id,
                brand,
                lastFour: digits.slice(-4) || '0000',
                expiry: expiry || '12/30',
                holderName: holder || t('common:holder.default'),
                label: t('common:holder.cardLabel'),
                isDefault: false,
              });
              selectPayment(id);
              navigate(returnToCheckout ? routes.checkout : routes.cards);
            }}
          >
            {t('common:save')}
          </Button>
        </PanelCard>
      </SubPageLayout>
    </div>
  );
}

export function SettingsPage() {
  const { t } = useTranslation('account');
  const { logout, resetOnboarding } = useAuth();
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [dark, setDark] = useState(false);

  const replayOnboarding = () => {
    resetOnboarding();
    logout();
  };

  return (
    <div data-screen-label={screenLabel('settings')}>
      <SubPageLayout title={t('settings.title')} backTo={routes.account} width="narrow">
        <div className="flex flex-col gap-4">
          <PanelCard className="p-5">
            <div className="mb-3 font-extrabold">{t('settings.notificationsSection')}</div>
            <ToggleRow label={t('settings.pushOrders')} checked={push} onChange={setPush} />
            <ToggleRow label={t('settings.promoEmails')} checked={email} onChange={setEmail} />
          </PanelCard>
          <PanelCard className="p-5">
            <div className="mb-3 font-extrabold">{t('settings.appearanceSection')}</div>
            <ToggleRow label={t('settings.darkTheme')} checked={dark} onChange={setDark} />
          </PanelCard>
          <PanelCard className="p-5">
            <div className="mb-2 font-extrabold">{t('settings.languageSection')}</div>
            <div className="text-sm">{t('settings.languageValue')}</div>
          </PanelCard>
          <PanelCard className="p-5">
            <div className="mb-3 font-extrabold">{t('settings.accountSection')}</div>
            <Button variant="outline" className="h-11 w-full rounded-lg font-semibold" onClick={replayOnboarding}>
              {t('settings.replayOnboarding')}
            </Button>
          </PanelCard>
          <Button variant="destructive" className="h-12 rounded-lg font-bold" onClick={logout}>
            {t('settings.deleteAccount')}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t('settings.deleteAccountNote')}</p>
        </div>
      </SubPageLayout>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between py-2">
      <span className="text-sm">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5" />
    </label>
  );
}

export function SubscriptionPage() {
  const { t } = useTranslation('account');
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isMobile, detailCols } = useLayout();
  const { data, loading } = useAsyncData(() => cityboxApi.getSubscription(), []);
  const sub = data ? mapSubscription(data) : null;
  const benefits = sub?.benefits ?? [];
  const renewalDate = sub?.renewalDate ?? '—';
  const priceMonthly = sub?.priceMonthly ?? 19.9;

  const planCard = (
    <SubscriptionPlanBanner
      title={user.isPlus ? t('subscription.planActive') : t('subscription.noSubscription')}
      subtitle={t('subscription.renewal', { date: renewalDate })}
    />
  );

  const benefitsCard = (
    <>
      <PanelCard className="p-5">
        <div className="mb-3 font-extrabold">{t('subscription.benefits')}</div>
        {loading ? (
          <p className="text-sm text-muted-foreground">{t('common:loading')}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-2 text-sm">
                <Check className="size-4 text-success" />
                {b}
              </li>
            ))}
          </ul>
        )}
      </PanelCard>
      <p className="text-sm text-muted-foreground">
        {t('subscription.priceMonthly', { price: priceMonthly.toFixed(2).replace('.', ',') })}
      </p>
      <Button variant="outline" className="h-12 rounded-lg font-bold" onClick={() => navigate(routes.account)}>
        {t('subscription.cancel')}
      </Button>
    </>
  );

  return (
    <div data-screen-label={screenLabel('cityboxPlus')}>
      <SubPageLayout title={t('subscription.title')} backTo={routes.account}>
        {isMobile ? (
          <div className="flex flex-col gap-4">
            {planCard}
            {benefitsCard}
          </div>
        ) : (
          <TwoColumnLayout columns={detailCols}>
            {planCard}
            <div className="flex flex-col gap-4">{benefitsCard}</div>
          </TwoColumnLayout>
        )}
      </SubPageLayout>
    </div>
  );
}
