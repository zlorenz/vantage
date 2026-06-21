'use client';

/**
 * LanguageSwitcher — toggles locale while preserving the current path.
 *
 * Shows a circular flag for the *opposite* language (click to switch).
 * Uses next-intl navigation hooks for locale-aware routing.
 */

import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import type { Locale } from '@/i18n/routing';

const FLAG: Record<Locale, { src: string; label: string; target: Locale }> = {
  en: {
    src: '/flags/cn.svg',
    label: 'Switch to Chinese',
    target: 'zh',
  },
  zh: {
    src: '/flags/gb.svg',
    label: 'Switch to English',
    target: 'en',
  },
};

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const { src, label, target } = FLAG[locale];

  return (
    <button
      type="button"
      className={`nav-link inline-flex items-center border-0 bg-transparent p-2 uppercase ${className}`}
      aria-label={label}
      onClick={() =>
        router.replace(
          { pathname, params } as Parameters<typeof router.replace>[0],
          { locale: target },
        )
      }
    >
      <Image
        src={src}
        alt=""
        width={20}
        height={20}
        className="h-5 w-5 rounded-full object-cover object-left"
      />
    </button>
  );
}
