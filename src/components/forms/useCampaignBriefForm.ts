'use client';

/**
 * useCampaignBriefForm — state for the 3-step branching Campaign Brief form.
 * Syncs step to `?step=` (pushState/popstate) and persists field values in
 * sessionStorage so refresh / Back-Forward restore progress.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS,
  CAMPAIGN_BRIEF_MAX_FILES,
  CAMPAIGN_BRIEF_REQUIRED_FIELDS,
  CAMPAIGN_BRIEF_STEPS,
  budgetOptionsForCampaignType,
  isValidEmail,
  type CampaignBriefArrayFieldKey,
  type CampaignBriefFieldKey,
  type CampaignBriefStepConfig,
} from '@/lib/campaign-brief-fields';
import {
  BRIEF_STEP_REQUIRED_FIELDS,
  clearBriefDraft,
  clampBriefStep,
  createInitialBriefValues,
  pushBriefStepUrl,
  readBriefStepFromLocation,
  replaceBriefStepUrl,
  resolveBriefInitialState,
  saveBriefDraft,
  type CampaignBriefFormValues,
} from '@/lib/campaign-brief-draft';
import { getCampaignBriefUi } from '@/lib/campaign-brief-i18n';
import { uploadBriefFilesToSanity } from '@/lib/campaign-brief-client-upload';
import type { BriefAttachmentMeta } from '@/lib/campaign-brief-attachments';
import type { Locale } from '@/i18n/routing';

export type { CampaignBriefFormValues };

export type CampaignBriefSubmissionState = 'idle' | 'submitting' | 'success' | 'error';

export type CampaignBriefFieldErrors = Partial<Record<CampaignBriefFieldKey | 'files', string>>;

export interface CampaignBriefVisibility {
  showProductBranch: boolean;
  showBrandingBranch: boolean;
  showDocumentaryBranch: boolean;
  showSocialBranch: boolean;
  showOtherBranch: boolean;
  showExtraDeliverables: boolean;
  showExtraDeliverablesOtherNote: boolean;
  showPostProdDeadline: boolean;
}

export interface UseCampaignBriefFormReturn {
  currentStep: number;
  currentStepConfig: CampaignBriefStepConfig;
  steps: CampaignBriefStepConfig[];
  nextStep: () => boolean;
  prevStep: () => void;
  goToStep: (step: number) => void;
  values: CampaignBriefFormValues;
  setFieldValue: (key: CampaignBriefFieldKey, value: string | string[] | boolean) => void;
  toggleArrayValue: (key: CampaignBriefArrayFieldKey, option: string) => void;
  errors: CampaignBriefFieldErrors;
  hasError: (key: CampaignBriefFieldKey | 'files') => boolean;
  clearStepErrors: () => void;
  visibility: CampaignBriefVisibility;
  files: File[];
  addFiles: (incoming: FileList | File[]) => void;
  removeFile: (index: number) => void;
  fileError: string | null;
  /** True when a session draft was restored (files are never restored). */
  restoredFromDraft: boolean;
  submissionState: CampaignBriefSubmissionState;
  submitError: string | null;
  submit: () => Promise<void>;
  resetForm: () => void;
  isDisabled: boolean;
  formStartTime: number;
  honeypot: string;
  setHoneypot: (value: string) => void;
}

/**
 * TEMP DEV ONLY — set to `false` before shipping.
 * When true, Next skips required-field checks so empty steps can be skimmed.
 */
const SKIP_STEP_REQUIRED_VALIDATION = false;

const DRAFT_SAVE_DEBOUNCE_MS = 300;

const ALLOWED_EXTENSIONS = new Set<string>(CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS);

function computeVisibility(values: CampaignBriefFormValues): CampaignBriefVisibility {
  const type = values.campaign_type;
  const showProductBranch = type === 'Product Campaign';
  const showBrandingBranch = type === 'Branding Campaign';
  const showDocumentaryBranch = type === 'Documentary / Live Event';
  const showSocialBranch = type === 'Social Media';
  const showOtherBranch = type === 'Other';
  const showExtraDeliverables = showProductBranch || showBrandingBranch;

  return {
    showProductBranch,
    showBrandingBranch,
    showDocumentaryBranch,
    showSocialBranch,
    showOtherBranch,
    showExtraDeliverables,
    showExtraDeliverablesOtherNote:
      showExtraDeliverables && values.extra_deliverables.includes('Other'),
    showPostProdDeadline:
      showDocumentaryBranch && values.production_scope === 'Filming + post-production',
  };
}

function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
}

function validateFields(
  values: CampaignBriefFormValues,
  keys: CampaignBriefFieldKey[],
  messages: { fieldRequired: string; invalidEmail: string },
): CampaignBriefFieldErrors {
  const errors: CampaignBriefFieldErrors = {};

  for (const key of keys) {
    const value = values[key as keyof CampaignBriefFormValues];
    const empty = Array.isArray(value)
      ? value.length === 0
      : typeof value === 'boolean'
        ? false
        : !String(value).trim();
    if (empty) {
      errors[key] = messages.fieldRequired;
    }
  }

  if (keys.includes('contact_email') && values.contact_email && !isValidEmail(values.contact_email)) {
    errors.contact_email = messages.invalidEmail;
  }

  return errors;
}

function validateFiles(
  files: File[],
  messages: {
    maxFilesAllowed: (max: number) => string;
    fileTypeNotAllowed: (filename: string) => string;
  },
): string | null {
  if (files.length > CAMPAIGN_BRIEF_MAX_FILES) {
    return messages.maxFilesAllowed(CAMPAIGN_BRIEF_MAX_FILES);
  }

  for (const file of files) {
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return messages.fileTypeNotAllowed(file.name);
    }
  }

  return null;
}

function buildSubmitPayload(
  values: CampaignBriefFormValues,
  attachments: BriefAttachmentMeta[],
  honeypot: string,
  formStartTime: number,
  locale: Locale,
): Record<string, unknown> {
  return {
    ...values,
    attachments,
    website: honeypot,
    _form_elapsed_ms: Date.now() - formStartTime,
    locale,
  };
}

function pushBriefSubmitEvent(): void {
  if (typeof window === 'undefined') return;

  const w = window as Window & {
    _vp_brief_pushed?: boolean;
    dataLayer?: Record<string, unknown>[];
  };

  if (w._vp_brief_pushed) return;

  w.dataLayer = w.dataLayer ?? [];
  w.dataLayer.push({
    event: 'CE - Client brief form submit',
    formId: '1',
    formName: 'client_brief',
  });
  w._vp_brief_pushed = true;
}

export function useCampaignBriefForm(locale: Locale = 'en'): UseCampaignBriefFormReturn {
  const formStartTimeRef = useRef(Date.now());
  const ui = useMemo(() => getCampaignBriefUi(locale), [locale]);
  const validationMessages = useMemo(
    () => ({ fieldRequired: ui.fieldRequired, invalidEmail: ui.invalidEmail }),
    [ui.fieldRequired, ui.invalidEmail],
  );

  // SSR + first paint use empty defaults; session draft hydrates in useEffect
  // (useState initializers do not re-run on the client after SSR).
  const [currentStep, setCurrentStep] = useState(1);
  const [values, setValues] = useState<CampaignBriefFormValues>(createInitialBriefValues);
  const [restoredFromDraft, setRestoredFromDraft] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<CampaignBriefFieldErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<CampaignBriefSubmissionState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  /** How many step advances we pushed this session (for Previous → history.back). */
  const pushedDepthRef = useRef(0);
  const skipDraftSaveRef = useRef(false);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const visibility = useMemo(() => computeVisibility(values), [values]);

  const currentStepConfig = useMemo(
    () => ui.steps.find((s) => s.step === currentStep) ?? ui.steps[0],
    [currentStep, ui.steps],
  );

  const isDisabled = submissionState === 'submitting';
  const totalSteps = CAMPAIGN_BRIEF_STEPS.length;

  // Restore draft + align URL once on the client.
  useEffect(() => {
    const resolved = resolveBriefInitialState();
    skipDraftSaveRef.current = true;
    setValues(resolved.values);
    setCurrentStep(resolved.step);
    setRestoredFromDraft(resolved.restoredFromDraft);
    replaceBriefStepUrl(resolved.step);
    setHydrated(true);
  }, []);

  // Debounced draft persistence (after hydrate).
  useEffect(() => {
    if (!hydrated) return;
    if (skipDraftSaveRef.current) {
      skipDraftSaveRef.current = false;
      return;
    }
    if (submissionState === 'success') return;

    const timer = window.setTimeout(() => {
      saveBriefDraft(currentStep, values);
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [hydrated, currentStep, values, submissionState]);

  // Browser Back/Forward → sync step from URL (clamp to completed steps).
  useEffect(() => {
    function onPopState() {
      const urlStep = readBriefStepFromLocation() ?? 1;
      const next = clampBriefStep(urlStep, valuesRef.current);
      setCurrentStep(next);
      if (next !== urlStep) {
        replaceBriefStepUrl(next);
      }
      // Depth unknown after arbitrary history traversal; fall back to replaceState.
      pushedDepthRef.current = 0;
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setFieldValue = useCallback(
    (key: CampaignBriefFieldKey, value: string | string[] | boolean) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value } as CampaignBriefFormValues;

        if (key === 'campaign_type' && typeof value === 'string') {
          const allowed = budgetOptionsForCampaignType(value);
          if (next.budget_range && !allowed.includes(next.budget_range)) {
            next.budget_range = '';
          }
        }

        return next;
      });
    },
    [],
  );

  const toggleArrayValue = useCallback((key: CampaignBriefArrayFieldKey, option: string) => {
    setValues((prev) => {
      const current = prev[key];
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      return { ...prev, [key]: next };
    });
  }, []);

  const hasError = useCallback(
    (key: CampaignBriefFieldKey | 'files') => Boolean(errors[key]),
    [errors],
  );

  const clearStepErrors = useCallback(() => {
    const stepFields = BRIEF_STEP_REQUIRED_FIELDS[currentStep] ?? [];
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of stepFields) {
        delete next[key];
      }
      return next;
    });
  }, [currentStep]);

  const nextStep = useCallback((): boolean => {
    const stepFields = BRIEF_STEP_REQUIRED_FIELDS[currentStep] ?? [];

    if (!SKIP_STEP_REQUIRED_VALIDATION) {
      const stepErrors = validateFields(values, stepFields, validationMessages);

      if (Object.keys(stepErrors).length > 0) {
        setErrors((prev) => ({ ...prev, ...stepErrors }));
        return false;
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      for (const key of stepFields) {
        delete next[key];
      }
      return next;
    });

    if (currentStep < totalSteps) {
      const next = currentStep + 1;
      setCurrentStep(next);
      pushBriefStepUrl(next);
      pushedDepthRef.current += 1;
    }

    return true;
  }, [currentStep, values, validationMessages, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep <= 1) return;
    clearStepErrors();

    if (pushedDepthRef.current > 0) {
      pushedDepthRef.current -= 1;
      window.history.back();
      return;
    }

    const prev = currentStep - 1;
    setCurrentStep(prev);
    replaceBriefStepUrl(prev);
  }, [currentStep, clearStepErrors]);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 1 || step >= currentStep) return;
      clearStepErrors();

      const delta = step - currentStep;
      if (pushedDepthRef.current > 0 && delta < 0 && -delta <= pushedDepthRef.current) {
        pushedDepthRef.current += delta;
        window.history.go(delta);
        return;
      }

      pushedDepthRef.current = 0;
      setCurrentStep(step);
      replaceBriefStepUrl(step);
    },
    [currentStep, clearStepErrors],
  );

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const incomingList = Array.from(incoming);
      const combined = [...files, ...incomingList];
      const validationError = validateFiles(combined, ui);

      if (validationError) {
        setFileError(validationError);
        return;
      }

      setFileError(null);
      setFiles(combined);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.files;
        return next;
      });
    },
    [files, ui],
  );

  const removeFile = useCallback(
    (index: number) => {
      setFiles((prev) => {
        const next = prev.filter((_, i) => i !== index);
        const validationError = validateFiles(next, ui);
        setFileError(validationError);
        if (!validationError) {
          setErrors((e) => {
            const updated = { ...e };
            delete updated.files;
            return updated;
          });
        }
        return next;
      });
    },
    [ui],
  );

  const submit = useCallback(async () => {
    const fieldErrors = validateFields(
      values,
      CAMPAIGN_BRIEF_REQUIRED_FIELDS,
      validationMessages,
    );
    const filesValidationError = validateFiles(files, ui);

    if (Object.keys(fieldErrors).length > 0 || filesValidationError) {
      setErrors(fieldErrors);
      if (filesValidationError) {
        setFileError(filesValidationError);
        setErrors((prev) => ({ ...prev, files: filesValidationError }));
      }
      return;
    }

    setSubmissionState('submitting');
    setSubmitError(null);
    setErrors({});
    setFileError(null);

    try {
      // Browser → Sanity first (fail loud). Raw bytes never hit /api/campaign-brief.
      let attachments: BriefAttachmentMeta[] = [];
      if (files.length > 0) {
        try {
          attachments = await uploadBriefFilesToSanity(files);
        } catch (err) {
          const raw = err instanceof Error ? err.message : '';
          const tagged = raw.includes('::') ? raw.split('::')[0] : '';
          const filename =
            (tagged && files.some((f) => f.name === tagged) ? tagged : null) ??
            files[0]?.name ??
            'file';
          const message = ui.fileUploadFailed(filename);
          setFileError(message);
          setErrors({ files: message });
          setSubmissionState('error');
          return;
        }
      }

      const payload = buildSubmitPayload(
        values,
        attachments,
        honeypot,
        formStartTimeRef.current,
        locale,
      );
      const response = await fetch('/api/campaign-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success: boolean;
        errors?: CampaignBriefFieldErrors;
        error?: string;
      };

      if (!response.ok || !result.success) {
        if (result.errors) {
          setErrors(result.errors);
          if (result.errors.files) {
            setFileError(result.errors.files);
          }
        }
        setSubmitError(result.error ?? ui.submitError);
        setSubmissionState('error');
        return;
      }

      pushBriefSubmitEvent();
      clearBriefDraft();
      setRestoredFromDraft(false);
      setSubmissionState('success');
    } catch {
      setSubmitError(ui.submitError);
      setSubmissionState('error');
    }
  }, [values, files, honeypot, validationMessages, ui, locale]);

  const resetForm = useCallback(() => {
    formStartTimeRef.current = Date.now();
    skipDraftSaveRef.current = true;
    clearBriefDraft();
    pushedDepthRef.current = 0;
    setCurrentStep(1);
    setValues(createInitialBriefValues());
    setRestoredFromDraft(false);
    setErrors({});
    setFiles([]);
    setFileError(null);
    setSubmissionState('idle');
    setSubmitError(null);
    setHoneypot('');
    replaceBriefStepUrl(1);

    if (typeof window !== 'undefined') {
      const w = window as Window & { _vp_brief_pushed?: boolean };
      w._vp_brief_pushed = false;
    }
  }, []);

  return {
    currentStep,
    currentStepConfig,
    steps: ui.steps,
    nextStep,
    prevStep,
    goToStep,
    values,
    setFieldValue,
    toggleArrayValue,
    errors,
    hasError,
    clearStepErrors,
    visibility,
    files,
    addFiles,
    removeFile,
    fileError,
    restoredFromDraft,
    submissionState,
    submitError,
    submit,
    resetForm,
    isDisabled,
    formStartTime: formStartTimeRef.current,
    honeypot,
    setHoneypot,
  };
}
