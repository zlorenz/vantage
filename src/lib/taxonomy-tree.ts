/**
 * taxonomy-tree — order taxonomy terms so children follow their parent.
 *
 * Terms arrive alphabetically from GROQ; this preserves that order for
 * top-level terms and nests subcategories (with depth) directly under
 * their parent for filter dropdowns.
 */

import type { TaxonomyTerm } from '@/types/sanity';

export interface TaxonomyTreeItem {
  term: TaxonomyTerm;
  depth: number;
}

export function flattenTaxonomyTree(
  terms: TaxonomyTerm[],
): TaxonomyTreeItem[] {
  const ids = new Set(terms.map((term) => term._id));
  const childrenByParent = new Map<string, TaxonomyTerm[]>();
  const roots: TaxonomyTerm[] = [];

  for (const term of terms) {
    // Treat terms whose parent is missing from the list as top-level.
    if (term.parentId && ids.has(term.parentId)) {
      const siblings = childrenByParent.get(term.parentId) ?? [];
      siblings.push(term);
      childrenByParent.set(term.parentId, siblings);
    } else {
      roots.push(term);
    }
  }

  const items: TaxonomyTreeItem[] = [];
  const visit = (term: TaxonomyTerm, depth: number) => {
    items.push({ term, depth });
    for (const child of childrenByParent.get(term._id) ?? []) {
      visit(child, depth + 1);
    }
  };

  for (const root of roots) visit(root, 0);
  return items;
}

/** Non-breaking indent prefix for native <option> labels. */
export function optionIndent(depth: number): string {
  return '\u00A0\u00A0\u00A0'.repeat(depth);
}
