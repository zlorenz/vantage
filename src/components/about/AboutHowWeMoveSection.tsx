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
const BULLET_COUNTS: Record<(typeof ITEM_KEYS)[number], number> = {
  discover: 4,
  develop: 5,
  produce: 4,
  deliver: 5,
};

export async function AboutHowWeMoveSection() {
  const t = await getTranslations('About');

  const items: HowWeMoveAccordionItem[] = ITEM_KEYS.map((key, index) => {
    const itemNumber = index + 1;
    const bulletCount = BULLET_COUNTS[key];

    return {
      id: key,
      label: t(`howWeMoveItem${itemNumber}Label`),
      headline: t(`howWeMoveItem${itemNumber}Headline`),
      bullets: Array.from({ length: bulletCount }, (_, bulletIndex) =>
        t(`howWeMoveItem${itemNumber}Bullet${bulletIndex + 1}`),
      ),
    };
  });

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
