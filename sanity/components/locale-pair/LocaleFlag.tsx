import {useId} from 'react'

type LocaleCode = 'en' | 'zh'

const LABELS: Record<LocaleCode, string> = {
  en: 'English',
  zh: 'Chinese',
}

function UsFlagSvg({size, clipId}: {size: number; clipId: string}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      width={size}
      height={size}
      aria-hidden
      style={{display: 'block', borderRadius: '50%'}}
    >
      <clipPath id={clipId}>
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="60" height="60" fill="#B22234" />
        <rect y="4.62" width="60" height="4.62" fill="#fff" />
        <rect y="13.85" width="60" height="4.62" fill="#fff" />
        <rect y="23.08" width="60" height="4.62" fill="#fff" />
        <rect y="32.31" width="60" height="4.62" fill="#fff" />
        <rect y="41.54" width="60" height="4.62" fill="#fff" />
        <rect y="50.77" width="60" height="4.62" fill="#fff" />
        <rect width="30" height="32.31" fill="#3C3B6E" />
      </g>
    </svg>
  )
}

function CnFlagSvg({size, clipId}: {size: number; clipId: string}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 60 60"
      width={size}
      height={size}
      aria-hidden
      style={{display: 'block', borderRadius: '50%'}}
    >
      <clipPath id={clipId}>
        <circle cx="30" cy="30" r="30" />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>
        <rect width="60" height="60" fill="#DE2910" />
        <polygon
          fill="#FFDE00"
          points="15,10 17.2,16.5 24,16.5 18.4,20.5 20.6,27 15,23 9.4,27 11.6,20.5 6,16.5 12.8,16.5"
        />
        <polygon
          fill="#FFDE00"
          points="28,6 28.8,8.5 31.5,8.5 29.3,10 30.1,12.5 28,11 25.9,12.5 26.7,10 24.5,8.5 27.2,8.5"
        />
        <polygon
          fill="#FFDE00"
          points="32,14 32.8,16.5 35.5,16.5 33.3,18 34.1,20.5 32,19 29.9,20.5 30.7,18 28.5,16.5 31.2,16.5"
        />
        <polygon
          fill="#FFDE00"
          points="32,22 32.8,24.5 35.5,24.5 33.3,26 34.1,28.5 32,27 29.9,28.5 30.7,26 28.5,24.5 31.2,24.5"
        />
        <polygon
          fill="#FFDE00"
          points="28,30 28.8,32.5 31.5,32.5 29.3,34 30.1,36.5 28,35 25.9,36.5 26.7,34 24.5,32.5 27.2,32.5"
        />
      </g>
    </svg>
  )
}

/** Circular US / CN flag chip for locale affordance inside inputs. */
export function LocaleFlag(props: {locale: LocaleCode; size?: number}) {
  const size = props.size ?? 18
  const clipId = useId().replace(/:/g, '')
  return props.locale === 'en' ? (
    <UsFlagSvg size={size} clipId={`us-${clipId}`} />
  ) : (
    <CnFlagSvg size={size} clipId={`cn-${clipId}`} />
  )
}

export function localeAriaLabel(locale: LocaleCode): string {
  return LABELS[locale]
}
