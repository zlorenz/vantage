'use client';

/**
 * useCampaignBriefForm — state for the 3-step branching Campaign Brief form.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS,
  CAMPAIGN_BRIEF_MAX_FILES,
  CAMPAIGN_BRIEF_REQUIRED_FIELDS,
  CAMPAIGN_BRIEF_STEPS,
  budgetOptionsForCampaignType,
  type CampaignBriefArrayFieldKey,
  type CampaignBriefFieldKey,
  type CampaignBriefStepConfig,
} from '@/lib/campaign-brief-fields';
import { getCampaignBriefUi } from '@/lib/campaign-brief-i18n';
import type { Locale } from '@/i18n/routing';

export type CampaignBriefSubmissionState = 'idle' | 'submitting' | 'success' | 'error';

export type CampaignBriefFieldErrors = Partial<Record<CampaignBriefFieldKey | 'files', string>>;

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
  submissionState: CampaignBriefSubmissionState;
  submitError: string | null;
  submit: () => Promise<void>;
  resetForm: () => void;
  isDisabled: boolean;
  formStartTime: number;
  honeypot: string;
  setHoneypot: (value: string) => void;
}

const STEP_REQUIRED_FIELDS: Record<number, CampaignBriefFieldKey[]> = {
  1: ['contact_name_first', 'contact_name_last', 'company_name', 'contact_email'],
  2: ['campaign_title', 'campaign_type', 'budget_range'],
};

/**
 * TEMP DEV ONLY — set to `false` before shipping.
 * When true, Next skips required-field checks so empty steps can be skimmed.
 */
const SKIP_STEP_REQUIRED_VALIDATION = false;

const ALLOWED_EXTENSIONS = new Set<string>(CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS);

function createInitialValues(): CampaignBriefFormValues {
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function buildFormData(
  values: CampaignBriefFormValues,
  files: File[],
  honeypot: string,
  formStartTime: number,
): FormData {
  const formData = new FormData();
  const arrayKeys = new Set<CampaignBriefArrayFieldKey>([
    'extra_deliverables',
    'social_channels',
    'aspect_ratios',
  ]);

  for (const key of Object.keys(values) as Array<keyof CampaignBriefFormValues>) {
    const value = values[key];
    if (arrayKeys.has(key as CampaignBriefArrayFieldKey) && Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item);
      }
    } else if (typeof value === 'boolean') {
      if (value) formData.append(key, 'true');
    } else if (typeof value === 'string') {
      formData.append(key, value);
    }
  }

  for (const file of files) {
    formData.append('briefing_materials_upload', file);
  }

  formData.append('website', honeypot);
  formData.append('_form_elapsed_ms', String(Date.now() - formStartTime));

  return formData;
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
    event: 'vp_brief_form_submit',
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

  const [currentStep, setCurrentStep] = useState(1);
  const [values, setValues] = useState<CampaignBriefFormValues>(createInitialValues);
  const [errors, setErrors] = useState<CampaignBriefFieldErrors>({});
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submissionState, setSubmissionState] = useState<CampaignBriefSubmissionState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState('');

  const visibility = useMemo(() => computeVisibility(values), [values]);

  const currentStepConfig = useMemo(
    () => ui.steps.find((s) => s.step === currentStep) ?? ui.steps[0],
    [currentStep, ui.steps],
  );

  const isDisabled = submissionState === 'submitting';
  const totalSteps = CAMPAIGN_BRIEF_STEPS.length;

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
    const stepFields = STEP_REQUIRED_FIELDS[currentStep] ?? [];
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of stepFields) {
        delete next[key];
      }
      return next;
    });
  }, [currentStep]);

  const nextStep = useCallback((): boolean => {
    const stepFields = STEP_REQUIRED_FIELDS[currentStep] ?? [];

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
      setCurrentStep((s) => s + 1);
    }

    return true;
  }, [currentStep, values, validationMessages, totalSteps]);

  const prevStep = useCallback(() => {
    if (currentStep <= 1) return;
    clearStepErrors();
    setCurrentStep((s) => s - 1);
  }, [currentStep, clearStepErrors]);

  const goToStep = useCallback(
    (step: number) => {
      if (step < 1 || step >= currentStep) return;
      clearStepErrors();
      setCurrentStep(step);
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
      const formData = buildFormData(values, files, honeypot, formStartTimeRef.current);
      formData.append('locale', locale);
      const response = await fetch('/api/campaign-brief', {
        method: 'POST',
        body: formData,
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
      setSubmissionState('success');
    } catch {
      setSubmitError(ui.submitError);
      setSubmissionState('error');
    }
  }, [values, files, honeypot, validationMessages, ui, locale]);

  const resetForm = useCallback(() => {
    formStartTimeRef.current = Date.now();
    setCurrentStep(1);
    setValues(createInitialValues());
    setErrors({});
    setFiles([]);
    setFileError(null);
    setSubmissionState('idle');
    setSubmitError(null);
    setHoneypot('');

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
