'use client';

/**
 * VpButton — primary and ghost button variants.
 *
 * Client component for onClick handlers. Renders as Link when href is provided.
 */

import { Link } from '@/i18n/navigation';

interface VpButtonBaseProps {
  children: React.ReactNode;
  variant?: 'primary' | 'ghost';
  className?: string;
}

interface VpButtonLinkProps extends VpButtonBaseProps {
  href: string;
  onClick?: never;
}

interface VpButtonActionProps extends VpButtonBaseProps {
  href?: never;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

type VpButtonProps = VpButtonLinkProps | VpButtonActionProps;

const VARIANT_CLASSES = {
  primary:
    'bg-vp-btn-primary-bg text-vp-btn-primary-text hover:bg-vp-btn-primary-hover-bg border-0',
  ghost:
    'bg-vp-btn-ghost-bg text-vp-btn-ghost-text border border-vp-btn-ghost-border hover:bg-vp-btn-ghost-hover-bg hover:border-vp-btn-ghost-hover-border',
} as const;

export function VpButton({
  children,
  variant = 'primary',
  className = '',
  ...props
}: VpButtonProps) {
  const classes = `inline-block px-8 py-3 text-sm font-semibold uppercase tracking-vp-btn transition-colors duration-vp-default ${VARIANT_CLASSES[variant]} ${className}`;

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const { onClick, type = 'button' } = props as VpButtonActionProps;
  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
    </button>
  );
}
