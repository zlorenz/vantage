/**
 * next-intl navigation helpers — locale-aware Link, redirect, router, pathname.
 *
 * Use these instead of next/link and next/navigation for internal routes
 * so locale prefixes are applied correctly (/ vs /zh/).
 */

import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
