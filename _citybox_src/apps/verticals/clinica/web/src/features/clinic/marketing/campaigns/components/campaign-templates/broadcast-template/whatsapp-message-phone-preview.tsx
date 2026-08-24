"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Battery,
  ChevronLeft,
  Phone,
  Signal,
  Video,
  Wifi,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@citybox/ui/atoms";
import { cn } from "@citybox/ui";
import { clinicSettingsKeys } from "@/features/clinic/modules/settings/hooks/query-keys";
import { getClinicProfile } from "@/features/clinic/modules/settings/services/clinic-profile.service";
import { useStore } from "@/lib/store-context";
import { useVerticalBranding } from "@/lib/vertical-branding-context";

type WhatsappMessagePhonePreviewProps = {
  messageBody: string;
  className?: string;
};

/** Wallpaper SVG estilo WhatsApp (tile de doodles em bege). */
const WHATSAPP_CHAT_BASE_COLOR = "#e5ddd5";

const WHATSAPP_CHAT_WALLPAPER_SVG = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="440" viewBox="0 0 220 440">
  <g fill="none" stroke="#8a7f72" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round" opacity="0.28">
    <path d="M24 28c7 0 12 4.5 12 10.5S31 49 24 49h-2.5l-4.5 4.5V49c-5.5 0-10-4.5-10-10.5S16 28 21.5 28H24z"/>
    <path d="M168 42c6 0 10.5 4 10.5 9s-4.5 9-10.5 9h-2l-4 4v-4c-4.5 0-8-4-8-9s3.5-9 8-9h6z"/>
    <path d="M96 78c8 0 13.5 5 13.5 11.5S104 101 96 101h-2.5l-5 5V101c-6 0-11-5-11-11.5S87.5 78 93.5 78H96z"/>
    <path d="M52 72c0-11 6.5-19 6.5-19S65 61 65 72s-6.5 14-6.5 14S52 83 52 72z"/><path d="M58.5 72v16"/>
    <path d="M190 95c0-9 5-15 5-15s5 6 5 15-5 12-5 12-5-3-5-12z"/><path d="M195 95v14"/>
    <path d="M34 120c7-5 15-5 15-5s-1.5 8-7 13-13.5 5-13.5 5 0-8 5.5-13z"/>
    <path d="M145 118c-8-1.5-13-8-13-8s8-1.5 15 1.5 10 11 10 11-3.5-3-12-4.5z"/>
    <path d="M78 130l1.5 4.2H84l-3.5 2.6 1.3 4.2-3.6-2.6-3.6 2.6 1.3-4.2-3.5-2.6h4.5z"/>
    <path d="M200 140l1.2 3.6H206l-3 2.2 1.1 3.6-3.2-2.2-3.2 2.2 1.1-3.6-3-2.2h4.4z"/>
    <circle cx="40" cy="168" r="7.5"/><path d="M40 164.5v4.2l2.5 1.6"/>
    <path d="M118 155v14"/><circle cx="114.5" cy="169" r="3.2"/><path d="M118 155l9.5-2.5v8"/><circle cx="124.5" cy="166.5" r="2.8"/>
    <rect x="170" y="165" width="11" height="17" rx="2"/><path d="M172.5 179h6"/>
    <path d="M58 200c0-4 3-7 6.5-7 2.2 0 4 1.2 4.8 2.8.8-1.6 2.6-2.8 4.8-2.8 3.5 0 6.5 3 6.5 7 0 5.5-11.3 13-11.3 13S58 205.5 58 200z"/>
    <path d="M140 198l3.2 3.2 6.5-7.2"/><path d="M145 198l3.2 3.2 6.5-7.2"/>
    <rect x="28" y="230" width="17" height="12" rx="1.2"/><path d="M28 231.5l8.5 6.2 8.5-6.2"/>
    <rect x="175" y="225" width="17" height="12.5" rx="1.5"/><circle cx="183.5" cy="231.5" r="3.2"/><path d="M178 225l1.5-2.2h5l1.5 2.2"/>
    <circle cx="100" cy="235" r="7.5"/><path d="M96.8 233.2h.01M103.2 233.2h.01"/><path d="M96.8 237.2c1.2 1.6 2.8 2.4 4.4 2.4s3.2-.8 4.4-2.4"/>
    <path d="M55 268c0 0 0-6.5 5-6.5s5 5 5 8.5-2.5 10-2.5 10-3.2 5-6.5 1.5"/>
    <rect x="145" y="260" width="11" height="9" rx="1.2"/><path d="M147.5 260v-2.5a3.2 3.2 0 0 1 6.4 0V260"/>
    <path d="M30 300l14-4.5-4.5 14-3.2-6.2-6.3-3.3z"/>
    <path d="M105 292c0-4 3.2-7 7-7 1.2 0 2.4.3 3.2 1A5.5 5.5 0 0 1 125 292c0 4-3.2 6.5-7 6.5h-13c-3.2 0-6.5-2.5-6.5-6.5z"/>
    <path d="M175 290h11v8a5.5 5.5 0 0 1-11 0v-8z"/><path d="M186 293h3.2a2.4 2.4 0 0 1 0 4.8H186"/><path d="M178 285c.8-1.5 1.6-2.4 1.6-2.4M183 285c.8-1.5 1.6-2.4 1.6-2.4"/>
    <path d="M48 330c6.5 0 11.5 4 11.5 9.5S54.5 349 48 349h-2l-4 4v-4c-5 0-9-4-9-9.5s4-9.5 9-9.5H48z"/>
    <path d="M155 325c0-10 6-17 6-17s6 7 6 17-6 12.5-6 12.5-6-2.5-6-12.5z"/><path d="M161 325v13"/>
    <path d="M90 345c-7-1.2-11.5-7-11.5-7s7-1.2 13 1.5 9 10 9 10-3-2.8-10.5-4.5z"/>
    <path d="M200 350l1.4 3.8H206l-3.2 2.4 1.2 3.8-3.4-2.4-3.4 2.4 1.2-3.8-3.2-2.4h4.6z"/>
    <circle cx="35" cy="380" r="7"/><path d="M35 376.5v4l2.3 1.5"/>
    <path d="M110 372v13"/><circle cx="106.8" cy="385" r="3"/><path d="M110 372l8.5-2.2v7.5"/><circle cx="115.8" cy="382.5" r="2.6"/>
    <path d="M170 378c0-3.5 2.6-6 5.5-6 2 0 3.5 1 4.2 2.4.7-1.4 2.2-2.4 4.2-2.4 3 0 5.5 2.5 5.5 6 0 4.8-9.7 11.2-9.7 11.2S170 382.8 170 378z"/>
    <path d="M55 405l2.8 2.8 5.5-6.2"/><path d="M59.5 405l2.8 2.8 5.5-6.2"/>
    <rect x="130" y="402" width="14" height="10" rx="1"/><path d="M130 403.2l7 5.2 7-5.2"/>
    <circle cx="195" cy="412" r="6.5"/><path d="M192.2 410.5h.01M197.8 410.5h.01"/><path d="M192.2 414c1 1.4 2.4 2.1 3.8 2.1s2.8-.7 3.8-2.1"/>
    <path d="M78 48c5.5 0 9.5 3.5 9.5 8.5S83.5 65 78 65h-1.8l-3.5 3.5V65c-4.2 0-7.7-3.5-7.7-8.5S72 48 76.2 48H78z"/>
    <path d="M20 95c0-8 4.5-13.5 4.5-13.5S29 87 29 95s-4.5 11-4.5 11S20 103 20 95z"/><path d="M24.5 95v12"/>
    <path d="M205 195c5.5-4 12-4 12-4s-1.2 6.5-5.5 10.5-11 4-11 4 0-6.5 4.5-10.5z"/>
    <path d="M75 175l12-4-4 12-2.8-5.4-5.2-2.6z"/>
    <rect x="195" y="270" width="10" height="15.5" rx="1.8"/><path d="M197.2 282.5h5.5"/>
    <path d="M12 250c0-3.2 2.4-5.5 5-5.5 1.8 0 3.2.9 3.8 2.2.6-1.3 2-2.2 3.8-2.2 2.6 0 5 2.3 5 5.5 0 4.4-8.8 10.2-8.8 10.2S12 254.4 12 250z"/>
    <path d="M88 410c0-8.5 5-14.5 5-14.5s5 6 5 14.5-5 10.5-5 10.5-5-2-5-10.5z"/><path d="M93 410v11"/>
  </g>
</svg>`.replace(/\s+/g, " ").trim(),
);

const WHATSAPP_CHAT_BG_STYLE = {
  backgroundColor: WHATSAPP_CHAT_BASE_COLOR,
  backgroundImage: `url("data:image/svg+xml,${WHATSAPP_CHAT_WALLPAPER_SVG}")`,
  backgroundRepeat: "repeat",
  backgroundSize: "160px 320px",
} as const;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CL";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/** Horário no estilo WhatsApp com AM/PM. */
function formatWhatsappClock(date: Date): string {
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const hours12 = hours24 % 12 || 12;
  const period = hours24 < 12 ? "AM" : "PM";
  return `${hours12}:${minutes} ${period}`;
}

function renderPreviewBody(
  template: string,
  clinicName: string,
  clinicPhone: string,
): string {
  const sampleDate = new Date();
  const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(
    sampleDate,
  );
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(sampleDate);
  const time = formatWhatsappClock(sampleDate);

  return template
    .replaceAll("{nome_paciente}", "Maria Silva")
    .replaceAll("{nome_clinica}", clinicName)
    .replaceAll("{telefone_clinica}", clinicPhone)
    .replaceAll("{dia_semana}", weekday)
    .replaceAll("{data}", date)
    .replaceAll("{hora}", time);
}

export function WhatsappMessagePhonePreview({
  messageBody,
  className,
}: WhatsappMessagePhonePreviewProps) {
  const { storeId, storeName } = useStore();
  const { displayName, logoUrl } = useVerticalBranding();

  const profileQuery = useQuery({
    queryKey: clinicSettingsKeys.profile(storeId ?? ""),
    queryFn: () => getClinicProfile(storeId!),
    enabled: Boolean(storeId),
  });

  const clinicName =
    profileQuery.data?.communicationsName?.trim() ||
    displayName?.trim() ||
    profileQuery.data?.clinicName?.trim() ||
    storeName?.trim() ||
    "Sua clínica";

  const clinicPhone =
    profileQuery.data?.mobile?.trim() ||
    profileQuery.data?.phone?.trim() ||
    "(11) 99999-0000";

  const avatarSrc = logoUrl || profileQuery.data?.logoUrl || undefined;

  const body = renderPreviewBody(
    messageBody.trim() || "Mensagem da campanha",
    clinicName,
    clinicPhone,
  );

  const time = formatWhatsappClock(new Date());

  return (
    <div className={cn("flex justify-center py-2", className)}>
      <div
        className={cn(
          "relative w-full max-w-[300px] overflow-hidden rounded-[2.35rem]",
          "border-[9px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-black/25",
        )}
      >
        <div className="absolute top-2.5 left-1/2 z-20 h-6 w-[92px] -translate-x-1/2 rounded-full bg-black" />

        <div className="overflow-hidden rounded-[1.75rem] bg-[#0b141a]">
          <div className="flex items-center justify-between bg-[#008069] px-5 pt-3.5 pb-1 text-[11px] font-medium text-white">
            <span className="tabular-nums">{time}</span>
            <div className="flex items-center gap-1 opacity-90">
              <Signal className="size-3" strokeWidth={2.5} />
              <Wifi className="size-3" strokeWidth={2.5} />
              <Battery className="size-3.5" strokeWidth={2.5} />
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#008069] px-1.5 pt-2 pb-1.5 text-white">
            <ChevronLeft
              className="size-6 shrink-0 opacity-95"
              strokeWidth={2}
            />
            <Avatar className="size-9 shrink-0 border-2 border-white/20 shadow-sm">
              {avatarSrc ? (
                <AvatarImage
                  src={avatarSrc}
                  alt={clinicName}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-teal-700 text-[11px] font-semibold text-white">
                {initialsFromName(clinicName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 pr-1">
              <p className="truncate text-[15px] leading-tight font-semibold tracking-tight">
                {clinicName}
              </p>
              <p className="text-[11px] leading-tight text-white/75">online</p>
            </div>
            <div className="flex shrink-0 items-center gap-3.5 pr-2.5">
              <Video className="size-[1.35rem]" strokeWidth={2} aria-hidden />
              <Phone className="size-[1.2rem]" strokeWidth={2} aria-hidden />
            </div>
          </div>

          <div
            className="relative min-h-[440px] overflow-hidden px-2.5 py-3"
            style={WHATSAPP_CHAT_BG_STYLE}
          >
            <div className="mb-4 flex justify-center">
              <span className="rounded-lg bg-[#e1f2fb] px-3 py-1 text-[11px] font-medium text-zinc-600 shadow-sm">
                Hoje
              </span>
            </div>

            <div className="flex justify-start">
              <div
                className={cn(
                  "relative max-w-[88%] rounded-xl rounded-tl-none bg-white px-2.5 pt-1.5 pb-1",
                  "text-[13.5px] leading-[1.35] text-zinc-900 shadow-sm",
                )}
              >
                {/* Pontinha: sai do canto superior esquerdo do balão para fora à esquerda */}
                <svg
                  className="pointer-events-none absolute top-0 left-0 -translate-x-[calc(100%-2px)]"
                  width="14"
                  height="12"
                  viewBox="0 0 14 12"
                  aria-hidden
                >
                  <path fill="#ffffff" d="M14 0H0l14 12V0Z" />
                </svg>
                <p className="pr-1 whitespace-pre-wrap">{body}</p>
                <div className="mt-0.5 flex items-center justify-end pl-8 text-[10px] text-zinc-500/80">
                  <time className="tabular-nums">{time}</time>
                </div>
              </div>
            </div>
          </div>

          <div
            className="flex justify-center pb-2"
            style={{ backgroundColor: WHATSAPP_CHAT_BASE_COLOR }}
          >
            <div className="h-1 w-28 rounded-full bg-zinc-900/80" />
          </div>
        </div>
      </div>
    </div>
  );
}
