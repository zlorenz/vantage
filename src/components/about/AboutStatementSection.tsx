/**
 * AboutStatementSection — server wrapper for the /about display statement.
 *
 * Resolves copy via next-intl and passes plain strings to the client child
 * that owns layout animation (AboutStatementAnimated).
 */

import { getTranslations } from 'next-intl/server';
import { AboutStatementAnimated } from '@/components/about/AboutStatementAnimated';

export async function AboutStatementSection() {
  const t = await getTranslations('About');

  return (
    <AboutStatementAnimated
      line1={t('statementLine1')}
      line2={t('statementLine2')}
      line3={t('statementLine3')}
      line4={t('statementLine4')}
      line5={t('statementLine5')}
    />
  );
}
