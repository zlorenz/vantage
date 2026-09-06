'use client';

/**
 * LanguageSwitcher — locale control that preserves the current path.
 * Prefers link[rel=alternate][hreflang] so bilingual slugs (EN ↔ ZH) swap correctly.
 *
 * - `cells` (desktop): both EN and CN cells with flag + label (Figma nav chrome)
 * - `toggle` (mobile): compact control that switches to the other locale
 */

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

const LOCALE_FLAG: Record<Locale, string> = {
  en: '/flags/gb.svg',
  zh: '/flags/cn.svg',
};

const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  zh: 'CN',
};

const LOCALES: Locale[] = ['en', 'zh'];

function alternatePathForLocale(target: Locale): string | null {
  if (typeof document === 'undefined') return null;
  const link = document.querySelector(
    `link[rel="alternate"][hreflang="${target}"]`,
  ) as HTMLLinkElement | null;
  if (!link?.href) return null;
  try {
    return new URL(link.href).pathname;
  } catch {
    return null;
  }
}

function useLocaleSwitch() {
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  return (target: Locale) => {
    const alternatePath = alternatePathForLocale(target);
    if (alternatePath) {
      // Path-only so production alternate hosts still work in local/staging.
      window.location.assign(alternatePath);
      return;
    }
    router.replace(
      { pathname, params } as Parameters<typeof router.replace>[0],
      { locale: target },
    );
  };
}

export function LanguageSwitcher({
  className = '',
  variant = 'toggle',
}: {
  className?: string;
  variant?: 'toggle' | 'cells';
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations('Nav');
  const switchTo = useLocaleSwitch();

  if (variant === 'cells') {
    return (
      <div className={`vp-lang-cells ${className}`.trim()} role="group">
        {LOCALES.map((code) => {
          const active = code === locale;
          return (
            <button
              key={code}
              type="button"
              className={`vp-lang-cell${active ? ' is-active' : ''}`}
              aria-label={code === 'en' ? t('switchToEnglish') : t('switchToChinese')}
              aria-current={active ? 'true' : undefined}
              disabled={active}
              onClick={() => {
                if (!active) switchTo(code);
              }}
            >
              <Image
                src={LOCALE_FLAG[code]}
                alt=""
                width={16}
                height={16}
                className="vp-lang-cell__flag"
              />
              <span className="vp-lang-cell__label">{LOCALE_LABEL[code]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const target: Locale = locale === 'en' ? 'zh' : 'en';
  const label = locale === 'zh' ? t('switchToEnglish') : t('switchToChinese');

  return (
    <button
      type="button"
      className={`nav-link inline-flex cursor-pointer items-center border-0 bg-transparent p-2 uppercase ${className}`}
      aria-label={label}
      onClick={() => switchTo(target)}
    >
      <Image
        src={LOCALE_FLAG[target]}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover object-left"
      />
    </button>
  );
}
