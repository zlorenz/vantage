'use client';

/**
 * BlogPostedOn — localized "Posted on [Month Day, Year]" with <time>.
 * Prefix via next-intl Blog.postedOn (EN "Posted on " / ZH "发布于 ").
 */

import { useTranslations } from 'next-intl';
import { formatBlogPublishDate } from '@/lib/blog-date';
import type { Locale } from '@/i18n/routing';

interface BlogPostedOnProps {
  publishedAt: string;
  locale: Locale;
}

export function BlogPostedOn({ publishedAt, locale }: BlogPostedOnProps) {
  const t = useTranslations('Blog');

  return (
    <span>
      <span className="sep">{t('postedOn')}</span>
      <time dateTime={publishedAt}>{formatBlogPublishDate(publishedAt, locale)}</time>
    </span>
  );
}
