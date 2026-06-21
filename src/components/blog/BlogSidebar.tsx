/**
 * BlogSidebar — category list for news index and category archives.
 */

import { Link } from '@/i18n/navigation';
import type { CategoryTerm } from '@/types/sanity';
import type { Locale } from '@/i18n/routing';

interface BlogSidebarProps {
  categories: CategoryTerm[];
  locale: Locale;
  activeSlug?: string;
}

export function BlogSidebar({ categories, locale, activeSlug }: BlogSidebarProps) {
  return (
    <aside className="vp-blog-sidebar sticky top-28">
      <div className="vp-blog-widget vp-blog-categories">
        <h3 className="vp-blog-widget__title mb-5 text-[clamp(1.75rem,2vw,3rem)] font-bold uppercase leading-tight">
          {locale === 'zh' ? '博客分类' : 'BLOG CATEGORIES'}
        </h3>
        <ul className="vp-blog-categories-list m-0 flex list-none flex-col gap-2 p-0">
          {categories.map((category) => {
            const slugParam =
              locale === 'zh' ? category.slugZh || category.slug : category.slug;
            const label =
              locale === 'zh' && category.titleZh
                ? category.titleZh
                : category.title;
            const isActive =
              activeSlug === category.slug || activeSlug === category.slugZh;

            return (
              <li key={category._id} className={isActive ? 'current-cat' : undefined}>
                <Link
                  href={{
                    pathname: '/category/[slug]',
                    params: { slug: slugParam },
                  }}
                  className="block rounded-lg bg-neutral-700 px-4 py-3 font-bold text-white no-underline hover:bg-neutral-600"
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
