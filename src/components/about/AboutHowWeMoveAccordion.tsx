'use client';

/**
 * About How We Move — accordion workflow section on /about.
 */

import { useId, useState } from 'react';
import './about-how-we-move.css';

export type HowWeMoveAccordionItem = {
  id: string;
  label: string;
  headline: string;
  bullets: readonly string[];
};

type AboutHowWeMoveAccordionProps = {
  subtitle: string;
  heading: string;
  items: readonly HowWeMoveAccordionItem[];
};

function ExpandToggle({ expanded }: { expanded: boolean }) {
  return (
    <span className="vp-how-we-move__toggle" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        <circle cx="12" cy="12" r="10.25" fill="none" stroke="currentColor" strokeWidth="1" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          d={expanded ? 'M8 12h8' : 'M12 8v8M8 12h8'}
        />
      </svg>
    </span>
  );
}

export function AboutHowWeMoveAccordion({
  subtitle,
  heading,
  items,
}: AboutHowWeMoveAccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggleItem(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <div className="vp-how-we-move">
      <div className="vp-how-we-move__intro">
        <p className="vp-how-we-move__subtitle">{subtitle}</p>
        <h2 className="vp-how-we-move__heading">{heading}</h2>
      </div>

      <div className="vp-how-we-move__list">
        {items.map((item, index) => {
          const expanded = openIndex === index;
          const panelId = `${baseId}-panel-${index}`;
          const triggerId = `${baseId}-trigger-${index}`;

          return (
            <div key={item.id} className="vp-how-we-move__item">
              <h3 className="vp-how-we-move__item-heading">
                <button
                  type="button"
                  id={triggerId}
                  className="vp-how-we-move__trigger"
                  aria-expanded={expanded}
                  aria-controls={panelId}
                  onClick={() => toggleItem(index)}
                >
                  <span className="vp-how-we-move__trigger-label">{item.label}</span>
                  <ExpandToggle expanded={expanded} />
                </button>
              </h3>

              {expanded ? (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={triggerId}
                  className="vp-how-we-move__panel"
                >
                  <p className="vp-how-we-move__headline">{item.headline}</p>
                  <ul className="vp-how-we-move__bullets">
                    {item.bullets.map((bullet, bulletIndex) => (
                      <li key={bulletIndex}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
