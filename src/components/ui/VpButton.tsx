'use client';

/**
 * VpButton — site-wide yellow / white / outline control.
 * Label-only by default. Pass an icon as children when a page needs one.
 */

import type { ComponentProps, ReactNode } from 'react';
import { Link } from '@/i18n/navigation';

type LinkHref = ComponentProps<typeof Link>['href'];
type Variant = 'yellow' | 'white' | 'outline';

interface VpButtonBaseProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  disabled?: boolean;
}

interface VpButtonLinkProps extends VpButtonBaseProps {
  href: LinkHref;
  onClick?: never;
  type?: never;
}

interface VpButtonActionProps extends VpButtonBaseProps {
  href?: never;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

type VpButtonProps = VpButtonLinkProps | VpButtonActionProps;

const VARIANT_CLASS: Record<Variant, string> = {
  yellow: 'vp-btn--yellow',
  white: 'vp-btn--white',
  outline: 'vp-btn--outline',
};

function buttonClassName(variant: Variant, className: string): string {
  return ['vp-btn', VARIANT_CLASS[variant], className].filter(Boolean).join(' ');
}

export function VpButton({
  children,
  variant = 'yellow',
  className = '',
  disabled = false,
  ...props
}: VpButtonProps) {
  const classes = buttonClassName(variant, className);

  if ('href' in props && props.href) {
    if (disabled) {
      return (
        <span className={classes} aria-disabled="true" role="link">
          {children}
        </span>
      );
    }

    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { onClick, type = 'button' } = props as VpButtonActionProps;
  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
