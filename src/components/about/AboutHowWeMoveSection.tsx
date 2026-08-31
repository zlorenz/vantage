/**
 * AboutHowWeMoveSection — workflow accordion below Production House on /about.
 */

import { getTranslations } from 'next-intl/server';
import {
  AboutHowWeMoveAccordion,
  type HowWeMoveAccordionItem,
} from '@/components/about/AboutHowWeMoveAccordion';
import { SectionWrapper } from '@/components/ui/SectionWrapper';

const ITEM_KEYS = ['discover', 'develop', 'produce', 'deliver'] as const;

export async function AboutHowWeMoveSection() {
  const t = await getTranslations('About');

  const items: HowWeMoveAccordionItem[] = ITEM_KEYS.map((key, index) => ({
    id: key,
    label: t(`howWeMoveItem${index + 1}Label`),
    headline: t(`howWeMoveItem${index + 1}Headline`),
    bullets: [
      t(`howWeMoveItem${index + 1}Bullet1`),
      t(`howWeMoveItem${index + 1}Bullet2`),
      t(`howWeMoveItem${index + 1}Bullet3`),
      t(`howWeMoveItem${index + 1}Bullet4`),
    ],
  }));

  return (
    <SectionWrapper fullBleed className="bg-white text-black">
      <div className="vp-content-rail">
        <AboutHowWeMoveAccordion
          subtitle={t('howWeMoveSubtitle')}
          heading={t('howWeMoveHeading')}
          items={items}
        />
      </div>
    </SectionWrapper>
  );
}
