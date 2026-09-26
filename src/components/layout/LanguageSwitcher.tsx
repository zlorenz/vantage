'use client';

/**
 * LanguageSwitcher — locale control that preserves the current path.
 * Prefers link[rel=alternate][hreflang] so bilingual slugs (EN ↔ ZH) swap correctly.
 *
 * Desktop ≥768: EN + 中文 cells (flag + label).
 * Mobile ≤767: single toggle cell for the *other* locale only (EN page → 中文,
 * ZH page → EN). Separate markup — do not rely on hiding `.is-active`.
 */

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

const LOCALE_FLAG: Record<Locale, string> = {
  en: '/flags/us.svg',
  zh: '/flags/cn.svg',
};

const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  zh: '中文',
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

function LangCellContent({ code }: { code: Locale }) {
  return (
    <>
      <Image
        src={LOCALE_FLAG[code]}
        alt=""
        width={16}
        height={16}
        className="vp-lang-cell__flag"
      />
      <span className="vp-lang-cell__label">{LOCALE_LABEL[code]}</span>
    </>
  );
}

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('Nav');
  const switchTo = useLocaleSwitch();
  const other: Locale = locale === 'zh' ? 'en' : 'zh';

  return (
    <div className={`vp-lang-cells ${className}`.trim()} role="group">
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <button
            key={`desktop-${code}`}
            type="button"
            className={`vp-lang-cell vp-lang-cell--desktop${active ? ' is-active' : ''}`}
            aria-label={code === 'en' ? t('switchToEnglish') : t('switchToChinese')}
            aria-current={active ? 'true' : undefined}
            disabled={active}
            onClick={() => {
              if (!active) switchTo(code);
            }}
          >
            <LangCellContent code={code} />
          </button>
        );
      })}
      <button
        type="button"
        className="vp-lang-cell vp-lang-cell--mobile"
        aria-label={other === 'en' ? t('switchToEnglish') : t('switchToChinese')}
        onClick={() => switchTo(other)}
      >
        <LangCellContent code={other} />
      </button>
    </div>
  );
}
