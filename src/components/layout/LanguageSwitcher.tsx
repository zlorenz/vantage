'use client';

/**
 * LanguageSwitcher — toggles locale while preserving the current path.
 * Prefers link[rel=alternate][hreflang] so bilingual slugs (EN ↔ ZH) swap correctly.
 */

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

const FLAG_SRC: Record<Locale, string> = {
  en: '/flags/cn.svg',
  zh: '/flags/gb.svg',
};

const TARGET_LOCALE: Record<Locale, Locale> = {
  en: 'zh',
  zh: 'en',
};

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

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations('Nav');
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const target = TARGET_LOCALE[locale];
  const label = locale === 'zh' ? t('switchToEnglish') : t('switchToChinese');

  return (
    <button
      type="button"
      className={`nav-link inline-flex cursor-pointer items-center border-0 bg-transparent p-2 uppercase ${className}`}
      aria-label={label}
      onClick={() => {
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
      }}
    >
      <Image
        src={FLAG_SRC[locale]}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover object-left"
      />
    </button>
  );
}
