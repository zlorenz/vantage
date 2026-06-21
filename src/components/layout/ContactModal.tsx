'use client';

/**
 * ContactModal — global informational contact overlay.
 *
 * Opened from the Contact nav item via ContactModalContext. No form —
 * displays email, WhatsApp, and address from siteSettings. Empty fields
 * are omitted.
 */

import { useEffect } from 'react';
import type { SiteSettings } from '@/types/sanity';
import { useContactModal } from './ContactModalContext';

interface ContactModalProps {
  siteSettings: SiteSettings;
}

function whatsappHref(value: string): string {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}

export function ContactModal({ siteSettings }: ContactModalProps) {
  const { isOpen, closeContact } = useContactModal();

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeContact();
    }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeContact]);

  if (!isOpen) return null;

  const title = siteSettings.contactModalTitle?.trim() || 'Contact';
  const email = siteSettings.contactEmail?.trim();
  const whatsapp = siteSettings.contactWhatsapp?.trim();
  const address = siteSettings.contactAddress?.trim();
  const waLink = whatsapp ? whatsappHref(whatsapp) : '';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vp-contact-modal-label"
      onClick={closeContact}
    >
      <div
        className="modal-content relative max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-vp-border-soft bg-vp-bg p-12 text-vp-text"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="btn-close absolute right-4 top-4 h-8 w-8 border-0 bg-transparent text-2xl text-white opacity-80 hover:opacity-100"
          aria-label="Close contact dialog"
          onClick={closeContact}
        >
          ×
        </button>

        <h2 id="vp-contact-modal-label" className="sr-only">
          {title}
        </h2>

        <ul className="mb-4 list-none p-0">
          {email ? (
            <li className="mb-2">
              <h3 className="m-0 text-xl font-bold uppercase">
                <a
                  href={`mailto:${email}`}
                  className="text-vp-link hover:text-vp-link-hover"
                >
                  {email}
                </a>
              </h3>
            </li>
          ) : null}

          {whatsapp && waLink ? (
            <li className="mb-1">
              <span className="mr-1 inline-block align-middle" aria-hidden>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="18"
                  height="18"
                  fill="currentColor"
                  className="text-vp-link"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.855L0 24l6.335-1.662A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.78 9.78 0 01-4.988-1.375l-.357-.214-3.76.987 1.004-3.66-.233-.375A9.818 9.818 0 1112 21.818z" />
                </svg>
              </span>
              <h5 className="inline text-base font-bold uppercase">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-vp-link hover:text-vp-link-hover"
                >
                  {whatsapp}
                </a>
              </h5>
            </li>
          ) : null}
        </ul>

        {address ? (
          <address className="h5 m-0 text-base font-bold uppercase not-italic leading-snug text-white">
            {address.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i < address.split('\n').length - 1 ? <br /> : null}
              </span>
            ))}
          </address>
        ) : null}
      </div>
    </div>
  );
}
