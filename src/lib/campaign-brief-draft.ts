/**
 * Campaign brief draft persistence (sessionStorage) + step URL helpers.
 * Field values/step survive refresh and same-tab Back/Forward; File[] do not.
 */

import {
  CAMPAIGN_BRIEF_STEPS,
  isValidEmail,
  type CampaignBriefFieldKey,
} from '@/lib/campaign-brief-fields';

export const BRIEF_STEP_QUERY_KEY = 'step';
export const BRIEF_TOTAL_STEPS = CAMPAIGN_BRIEF_STEPS.length;
export const BRIEF_DRAFT_STORAGE_KEY = 'vp_campaign_brief_draft';
export const BRIEF_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
export const BRIEF_DRAFT_VERSION = 1 as const;

/** Required fields that must be complete before advancing past each step. */
export const BRIEF_STEP_REQUIRED_FIELDS: Record<number, CampaignBriefFieldKey[]> =
  {
    1: [
      'contact_name_first',
      'contact_name_last',
      'company_name',
      'contact_email',
    ],
    2: ['campaign_title', 'campaign_type', 'budget_range'],
  };

export interface CampaignBriefFormValues {
  contact_name_first: string;
  contact_name_last: string;
  company_name: string;
  contact_email: string;
  discovery_source: string;
  campaign_title: string;
  campaign_type: string;
  brand_description: string;
  product_description: string;
  campaign_description: string;
  target_audience: string;
  reference_videos: string;
  delivery_deadline: string;
  delivery_deadline_unknown: boolean;
  delivery_deadline_note: string;
  extra_deliverables: string[];
  extra_deliverables_other_note: string;
  budget_range: string;
  project_description: string;
  shoot_event_date: string;
  shoot_event_date_unknown: boolean;
  shoot_event_date_note: string;
  production_scope: string;
  social_channels: string[];
  aspect_ratios: string[];
  additional_notes: string;
}

export type BriefDraftPayload = {
  v: typeof BRIEF_DRAFT_VERSION;
  at: number;
  step: number;
  values: CampaignBriefFormValues;
};

export function createInitialBriefValues(): CampaignBriefFormValues {
  return {
    contact_name_first: '',
    contact_name_last: '',
    company_name: '',
    contact_email: '',
    discovery_source: '',
    campaign_title: '',
    campaign_type: '',
    brand_description: '',
    product_description: '',
    campaign_description: '',
    target_audience: '',
    reference_videos: '',
    delivery_deadline: '',
    delivery_deadline_unknown: false,
    delivery_deadline_note: '',
    extra_deliverables: [],
    extra_deliverables_other_note: '',
    budget_range: '',
    project_description: '',
    shoot_event_date: '',
    shoot_event_date_unknown: false,
    shoot_event_date_note: '',
    production_scope: '',
    social_channels: [],
    aspect_ratios: [],
    additional_notes: '',
  };
}

/** Parse `?step=` into 1..BRIEF_TOTAL_STEPS; invalid/missing → null. */
export function parseStepParam(raw: string | null | undefined): number | null {
  if (raw == null || raw === '') return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > BRIEF_TOTAL_STEPS) return null;
  return n;
}

/** Build pathname + search with `step` set; preserves other query keys. */
export function buildStepUrl(
  pathname: string,
  search: string,
  step: number,
): string {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const clamped = Math.min(BRIEF_TOTAL_STEPS, Math.max(1, Math.trunc(step)));
  params.set(BRIEF_STEP_QUERY_KEY, String(clamped));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function isFieldFilled(
  values: CampaignBriefFormValues,
  key: CampaignBriefFieldKey,
): boolean {
  const value = values[key as keyof CampaignBriefFormValues];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'boolean') return true;
  return Boolean(String(value).trim());
}

/** Whether required fields for `step` are complete (step 3 has none). */
export function isBriefStepComplete(
  values: CampaignBriefFormValues,
  step: number,
): boolean {
  const keys = BRIEF_STEP_REQUIRED_FIELDS[step];
  if (!keys || keys.length === 0) return true;

  for (const key of keys) {
    if (!isFieldFilled(values, key)) return false;
  }

  if (
    keys.includes('contact_email') &&
    values.contact_email &&
    !isValidEmail(values.contact_email)
  ) {
    return false;
  }

  return true;
}

/**
 * Clamp a requested step so the user cannot skip incomplete required steps.
 * Returns the first incomplete step ≤ requested, or requested if all prior are done.
 */
export function clampBriefStep(
  requested: number,
  values: CampaignBriefFormValues,
): number {
  const target = Math.min(
    BRIEF_TOTAL_STEPS,
    Math.max(1, Math.trunc(requested) || 1),
  );

  for (let step = 1; step < target; step++) {
    if (!isBriefStepComplete(values, step)) return step;
  }

  return target;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function coerceString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function coerceBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** Merge stored JSON into a full values object (unknown keys ignored). */
export function normalizeBriefValues(raw: unknown): CampaignBriefFormValues {
  const base = createInitialBriefValues();
  if (!isPlainObject(raw)) return base;

  return {
    contact_name_first: coerceString(raw.contact_name_first),
    contact_name_last: coerceString(raw.contact_name_last),
    company_name: coerceString(raw.company_name),
    contact_email: coerceString(raw.contact_email),
    discovery_source: coerceString(raw.discovery_source),
    campaign_title: coerceString(raw.campaign_title),
    campaign_type: coerceString(raw.campaign_type),
    brand_description: coerceString(raw.brand_description),
    product_description: coerceString(raw.product_description),
    campaign_description: coerceString(raw.campaign_description),
    target_audience: coerceString(raw.target_audience),
    reference_videos: coerceString(raw.reference_videos),
    delivery_deadline: coerceString(raw.delivery_deadline),
    delivery_deadline_unknown: coerceBoolean(raw.delivery_deadline_unknown),
    delivery_deadline_note: coerceString(raw.delivery_deadline_note),
    extra_deliverables: coerceStringArray(raw.extra_deliverables),
    extra_deliverables_other_note: coerceString(
      raw.extra_deliverables_other_note,
    ),
    budget_range: coerceString(raw.budget_range),
    project_description: coerceString(raw.project_description),
    shoot_event_date: coerceString(raw.shoot_event_date),
    shoot_event_date_unknown: coerceBoolean(raw.shoot_event_date_unknown),
    shoot_event_date_note: coerceString(raw.shoot_event_date_note),
    production_scope: coerceString(raw.production_scope),
    social_channels: coerceStringArray(raw.social_channels),
    aspect_ratios: coerceStringArray(raw.aspect_ratios),
    additional_notes: coerceString(raw.additional_notes),
  };
}

export function saveBriefDraft(
  step: number,
  values: CampaignBriefFormValues,
): void {
  if (typeof window === 'undefined') return;
  const payload: BriefDraftPayload = {
    v: BRIEF_DRAFT_VERSION,
    at: Date.now(),
    step: clampBriefStep(step, values),
    values,
  };
  try {
    sessionStorage.setItem(BRIEF_DRAFT_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / private mode — form still works in memory.
  }
}

export function loadBriefDraft(): BriefDraftPayload | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(BRIEF_DRAFT_STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isPlainObject(parsed)) return null;
    if (parsed.v !== BRIEF_DRAFT_VERSION) return null;
    if (typeof parsed.at !== 'number' || Date.now() - parsed.at > BRIEF_DRAFT_TTL_MS) {
      clearBriefDraft();
      return null;
    }
    const values = normalizeBriefValues(parsed.values);
    const step = clampBriefStep(
      typeof parsed.step === 'number' ? parsed.step : 1,
      values,
    );
    return {v: BRIEF_DRAFT_VERSION, at: parsed.at, step, values};
  } catch {
    return null;
  }
}

export function clearBriefDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(BRIEF_DRAFT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function readBriefStepFromLocation(
  search: string = typeof window !== 'undefined' ? window.location.search : '',
): number | null {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  return parseStepParam(params.get(BRIEF_STEP_QUERY_KEY));
}

export function replaceBriefStepUrl(step: number): void {
  if (typeof window === 'undefined') return;
  const next = buildStepUrl(
    window.location.pathname,
    window.location.search,
    step,
  );
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  window.history.replaceState(window.history.state, '', next);
}

export function pushBriefStepUrl(step: number): void {
  if (typeof window === 'undefined') return;
  const next = buildStepUrl(
    window.location.pathname,
    window.location.search,
    step,
  );
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  window.history.pushState(window.history.state, '', next);
}

export type BriefInitialState = {
  step: number;
  values: CampaignBriefFormValues;
  restoredFromDraft: boolean;
};

/** Resolve step + values from session draft and current URL (client only). */
export function resolveBriefInitialState(): BriefInitialState {
  if (typeof window === 'undefined') {
    return {
      step: 1,
      values: createInitialBriefValues(),
      restoredFromDraft: false,
    };
  }

  const draft = loadBriefDraft();
  const values = draft?.values ?? createInitialBriefValues();
  const urlStep = readBriefStepFromLocation();
  const requested = urlStep ?? draft?.step ?? 1;
  const step = clampBriefStep(requested, values);

  return {
    step,
    values,
    restoredFromDraft: Boolean(draft),
  };
}
