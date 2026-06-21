'use client';

/**
 * ContactModalContext — shared open/close state for the global contact modal.
 *
 * SiteHeader's Contact nav item calls openContact() without prop-drilling through
 * server components. LayoutShell provides this context at the layout level.
 */

import { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface ContactModalContextValue {
  isOpen: boolean;
  openContact: () => void;
  closeContact: () => void;
}

const ContactModalContext = createContext<ContactModalContextValue | null>(null);

export function ContactModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openContact = useCallback(() => setIsOpen(true), []);
  const closeContact = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openContact, closeContact }),
    [isOpen, openContact, closeContact]
  );

  return (
    <ContactModalContext.Provider value={value}>{children}</ContactModalContext.Provider>
  );
}

export function useContactModal(): ContactModalContextValue {
  const ctx = useContext(ContactModalContext);
  if (!ctx) {
    throw new Error('useContactModal must be used within ContactModalProvider');
  }
  return ctx;
}
