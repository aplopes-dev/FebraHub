"use client"

import { useId } from "react"

import { cn } from "../../../lib/utils"

/** Espaço extra entre o ícone e o wordmark (unidades do viewBox). */
const FULL_LOGO_TEXT_OFFSET = 16
/** Escala do símbolo na variante full (um pouco maior que o wordmark). */
const FULL_SYMBOL_SCALE = 1.1
const FULL_SYMBOL_CX = 71.5
const FULL_SYMBOL_CY = 82.5
/** Padding à esquerda no viewBox — evita clip após escala do símbolo. */
const FULL_SYMBOL_LEFT_PAD = FULL_SYMBOL_CX * (FULL_SYMBOL_SCALE - 1)

export interface LogoProps {
  /** "full" = logotipo com wordmark; "symbol" = ícone (logobrand) */
  variant?: "full" | "symbol"
  /** Cor sólida do quadrado do ícone. Ignorado se `brandGradient` estiver definido. */
  brandColor?: string
  /**
   * Gradiente do ícone via tokens CSS (`--primary-gradient-hover-stop-*`).
   * Usado no admin-web para espelhar o botão default.
   */
  brandGradient?: "primary"
  className?: string
}

function LogoBrandGradient({
  id,
  y1,
  y2,
  objectBoundingBox = false,
}: {
  id: string
  y1?: number
  y2?: number
  objectBoundingBox?: boolean
}) {
  return (
    <linearGradient
      id={id}
      x1="0"
      y1={objectBoundingBox ? "0" : y1}
      x2="0"
      y2={objectBoundingBox ? "1" : y2}
      gradientUnits={objectBoundingBox ? "objectBoundingBox" : "userSpaceOnUse"}
    >
      <stop
        offset="0%"
        stopColor="var(--primary-gradient-hover-stop-start, currentColor)"
      />
      <stop
        offset="52%"
        stopColor="var(--primary-gradient-hover-stop-mid, currentColor)"
      />
      <stop
        offset="100%"
        stopColor="var(--primary-gradient-hover-stop-end, currentColor)"
      />
    </linearGradient>
  )
}

function SymbolIconPaths() {
  return (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M71.463 30.2278L108.045 44.3509L71.463 58.4776L34.8813 44.3509L71.463 30.2278Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.8779 88.8172L68.1202 109.623V67.1577L53.1723 57.5152L34.8797 45.7175L34.8779 69.3155V88.8172Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M108.049 88.8199L74.8052 109.623V67.1577L89.7531 57.5152L108.047 45.7175L108.049 69.3155V88.8199Z"
        fill="white"
      />
    </>
  )
}

function FullIconPaths() {
  return (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M71.463 41.2278L108.045 55.3509L71.463 69.4776L34.8813 55.3509L71.463 41.2278Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.8779 99.8172L68.1202 120.623V78.1577L53.1723 68.5152L34.8797 56.7175L34.8779 80.3155V99.8172Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M108.049 99.8199L74.8052 120.623V78.1577L89.7531 68.5152L108.047 56.7175L108.049 80.3155V99.8199Z"
        fill="white"
      />
    </>
  )
}

function resolveBrandFill({
  brandColor,
  brandGradient,
  gradientId,
}: {
  brandColor?: string
  brandGradient?: "primary"
  gradientId: string
}) {
  if (brandGradient === "primary") {
    return `url(#${gradientId})`
  }

  return brandColor ?? "currentColor"
}

export function Logo({
  variant = "full",
  brandColor,
  brandGradient,
  className,
}: LogoProps) {
  const gradientId = `citybox-logo-brand-${useId().replace(/:/g, "")}`
  const iconFill = resolveBrandFill({ brandColor, brandGradient, gradientId })

  if (variant === "symbol") {
    return (
      <svg
        viewBox="0 0 143 143"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("h-9 w-auto", className)}
        aria-label="Citybox"
        role="img"
      >
        {brandGradient === "primary" ? (
          <defs>
            <LogoBrandGradient id={gradientId} y1={0} y2={143} />
          </defs>
        ) : null}
        <rect width="143" height="143" rx="34" fill={iconFill} />
        <SymbolIconPaths />
      </svg>
    )
  }

  const fullViewBoxWidth = 605 + FULL_LOGO_TEXT_OFFSET + FULL_SYMBOL_LEFT_PAD

  return (
    <svg
      viewBox={`${-FULL_SYMBOL_LEFT_PAD} 0 ${fullViewBoxWidth} 166`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-9 w-auto", className)}
      aria-label="Citybox"
      role="img"
    >
      {brandGradient === "primary" ? (
        <defs>
          <LogoBrandGradient id={gradientId} objectBoundingBox />
        </defs>
      ) : null}
      <g transform={`translate(${FULL_LOGO_TEXT_OFFSET}, 0)`}>
        <path
          d="M204.471 129.036C196.071 129.036 188.647 127.085 182.199 123.182C175.836 119.279 170.872 113.849 167.309 106.892C163.745 99.9345 161.963 91.8319 161.963 82.5838C161.963 73.3357 163.745 65.2755 167.309 58.403C170.872 51.4458 175.836 46.0157 182.199 42.1129C188.647 38.21 196.071 36.2586 204.471 36.2586C213.888 36.2586 221.991 38.6342 228.779 43.3855C235.651 48.052 240.572 54.5002 243.542 62.7301L228.015 68.4571C226.148 63.2816 223.179 59.2515 219.106 56.3668C215.119 53.4821 210.24 52.0397 204.471 52.0397C199.21 52.0397 194.586 53.2699 190.599 55.7304C186.696 58.1909 183.684 61.712 181.563 66.2936C179.526 70.7904 178.508 76.2204 178.508 82.5838C178.508 88.9471 179.526 94.4196 181.563 99.0012C183.684 103.583 186.696 107.104 190.599 109.564C194.586 112.025 199.21 113.255 204.471 113.255C210.24 113.255 215.119 111.813 219.106 108.928C223.179 106.043 226.148 102.013 228.015 96.8377L243.542 102.437C240.572 110.667 235.651 117.158 228.779 121.909C221.991 126.661 213.888 129.036 204.471 129.036ZM254.866 127V64.2573H270.648V127H254.866ZM254.357 54.585V38.2949H271.284V54.585H254.357ZM310.115 128.273C306.721 128.273 303.582 127.636 300.697 126.364C297.813 125.091 295.479 123.012 293.698 120.128C292.001 117.243 291.152 113.382 291.152 108.546V49.6216L307.188 41.0947V104.219C307.188 107.868 307.655 110.625 308.588 112.492C309.606 114.358 311.558 115.291 314.442 115.291C315.291 115.291 316.224 115.207 317.242 115.037C318.345 114.867 319.533 114.613 320.806 114.273V126.364C319.024 127.042 317.242 127.509 315.46 127.764C313.679 128.103 311.897 128.273 310.115 128.273ZM279.698 76.6022V64.2573H320.806V76.6022H279.698ZM338.011 152.962L350.737 122.164L327.066 64.2573H344.374L359.137 106.383L374.154 64.2573H391.208L355.192 152.962H338.011ZM434.753 128.273C431.614 128.273 428.56 127.679 425.59 126.491C422.705 125.218 420.16 123.14 417.954 120.255C415.748 117.285 414.094 113.34 412.991 108.419L416.809 110.201V127H401.028V38.2949H416.809V81.1839L413.5 82.202C414.263 77.8749 415.663 74.3114 417.7 71.5116C419.821 68.6268 422.366 66.5057 425.336 65.1482C428.305 63.7058 431.444 62.9847 434.753 62.9847C439.674 62.9847 444.171 64.2998 448.244 66.9299C452.316 69.4753 455.54 73.166 457.916 78.0022C460.292 82.8383 461.479 88.6926 461.479 95.565C461.479 101.759 460.419 107.358 458.298 112.364C456.177 117.285 453.08 121.188 449.007 124.073C445.02 126.873 440.268 128.273 434.753 128.273ZM430.426 113.764C433.566 113.764 436.238 113.043 438.444 111.601C440.735 110.073 442.517 107.952 443.789 105.237C445.062 102.522 445.698 99.2982 445.698 95.565C445.698 91.8319 445.062 88.6502 443.789 86.02C442.517 83.305 440.735 81.2263 438.444 79.7839C436.238 78.2567 433.566 77.4931 430.426 77.4931C427.372 77.4931 424.699 78.2567 422.409 79.7839C420.203 81.2263 418.463 83.305 417.191 86.02C416.003 88.735 415.409 91.9167 415.409 95.565C415.409 99.2134 416.003 102.395 417.191 105.11C418.463 107.825 420.203 109.946 422.409 111.473C424.699 113.001 427.372 113.764 430.426 113.764ZM502.869 128.273C496.76 128.273 491.33 126.873 486.579 124.073C481.828 121.273 478.052 117.413 475.252 112.492C472.537 107.486 471.18 101.844 471.18 95.565C471.18 89.2017 472.537 83.6019 475.252 78.7658C477.967 73.8448 481.7 69.9844 486.452 67.1845C491.288 64.3846 496.76 62.9847 502.869 62.9847C508.893 62.9847 514.281 64.3846 519.032 67.1845C523.783 69.9844 527.517 73.8448 530.232 78.7658C532.947 83.6019 534.304 89.2017 534.304 95.565C534.304 101.844 532.947 107.443 530.232 112.364C527.517 117.285 523.783 121.188 519.032 124.073C514.281 126.873 508.893 128.273 502.869 128.273ZM502.869 114.401C506.093 114.401 508.851 113.637 511.141 112.11C513.517 110.583 515.299 108.419 516.487 105.619C517.759 102.819 518.396 99.4679 518.396 95.565C518.396 91.5773 517.759 88.226 516.487 85.5109C515.299 82.7111 513.517 80.5899 511.141 79.1476C508.851 77.6204 506.093 76.8568 502.869 76.8568C499.56 76.8568 496.718 77.6204 494.342 79.1476C491.967 80.5899 490.142 82.7111 488.87 85.5109C487.597 88.226 486.961 91.5773 486.961 95.565C486.961 99.4679 487.597 102.819 488.87 105.619C490.142 108.419 491.967 110.583 494.342 112.11C496.718 113.637 499.56 114.401 502.869 114.401ZM537.991 127L559.372 95.3105L537.991 64.2573H556.699L569.935 85.0019L583.171 64.2573H601.879L580.244 95.3105L601.879 127H583.171L569.935 105.874L556.572 127H537.991Z"
          fill="currentColor"
        />
      </g>
      <g
        transform={`translate(${FULL_SYMBOL_CX} ${FULL_SYMBOL_CY}) scale(${FULL_SYMBOL_SCALE}) translate(${-FULL_SYMBOL_CX} ${-FULL_SYMBOL_CY})`}
      >
        <rect y="11" width="143" height="143" rx="34" fill={iconFill} />
        <FullIconPaths />
      </g>
    </svg>
  )
}
