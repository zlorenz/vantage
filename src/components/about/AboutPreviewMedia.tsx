'use client';

/**
 * Poster + optional Vimeo/YouTube looping preview for About CTA rows.
 * ZH never loads video (poster only) — same rule as the tab panels.
 */

import {useLocale} from 'next-intl';
import Image from 'next/image';
import {useCallback, useRef, useState} from 'react';
import {AboutLoopingPreview} from '@/components/about/AboutLoopingPreview';

type AboutPreviewMediaProps = {
  imageSrc: string;
  imageAlt?: string;
  previewVimeoUrl?: string | null;
  previewStartSeconds?: number | null;
  previewEndSeconds?: number | null;
  sizes: string;
  wash?: boolean;
};

export function AboutPreviewMedia({
  imageSrc,
  imageAlt = '',
  previewVimeoUrl,
  previewStartSeconds,
  previewEndSeconds,
  sizes,
  wash = false,
}: AboutPreviewMediaProps) {
  const locale = useLocale();
  const allowVideoPreview = locale !== 'zh' && Boolean(previewVimeoUrl);
  const [ready, setReady] = useState(false);
  const onReadyRef = useRef<(value: boolean) => void>((value) => setReady(value));
  onReadyRef.current = (value) => setReady(value);

  const onReadyChange = useCallback((value: boolean) => {
    onReadyRef.current(value);
  }, []);

  const posterVisible = Boolean(imageSrc) && !(allowVideoPreview && ready);

  return (
    <>
      {allowVideoPreview && previewVimeoUrl ? (
        <div className="vp-about-feature__preview">
          <AboutLoopingPreview
            url={previewVimeoUrl}
            active
            previewStartSeconds={previewStartSeconds}
            previewEndSeconds={previewEndSeconds}
            onReadyChange={onReadyChange}
          />
        </div>
      ) : null}
      {posterVisible ? (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          sizes={sizes}
          className="object-cover"
        />
      ) : null}
      {wash ? <span className="vp-about-feature__wash" /> : null}
    </>
  );
}
