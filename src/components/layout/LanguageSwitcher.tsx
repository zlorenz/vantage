'use client';

/**
 * LanguageSwitcher — toggles locale while preserving the current path.
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
      onClick={() =>
        router.replace(
          { pathname, params } as Parameters<typeof router.replace>[0],
          { locale: target },
        )
      }
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
