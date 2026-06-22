'use client';

/**
 * useCampaignBriefForm — state management for the 7-step Campaign Brief form.
 * Handles field values, step navigation, conditional visibility, file uploads,
 * validation (on next/submit only), and multipart submission to the API route.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS,
  CAMPAIGN_BRIEF_MAX_FILES,
  CAMPAIGN_BRIEF_REQUIRED_FIELDS,
  CAMPAIGN_BRIEF_STEPS,
  REFERRAL_DISCOVERY_SOURCES,
  type CampaignBriefFieldKey,
  type CampaignBriefStepConfig,
} from '@/lib/campaign-brief-fields';

/** Submission lifecycle — drives loading spinner, success screen, error message. */
export type CampaignBriefSubmissionState = 'idle' | 'submitting' | 'success' | 'error';

/** Per-field validation errors — keys match form fields plus optional files key. */
export type CampaignBriefFieldErrors = Partial<Record<CampaignBriefFieldKey | 'files', string>>;

/**
 * All 42 field values.
 * Text/select/radio/textarea fields are strings; deliverables is a checkbox array.
 */
export interface CampaignBriefFormValues {
  project_title: string;
  company_name: string;
  project_type: string;
  discovery_source: string;
  referral_source_other: string;
  referrer_name: string;
  contact_name_first: string;
  contact_name_last: string;
  contact_job_title: string;
  contact_email: string;
  contact_phone: string;
  campaign_goals: string;
  key_message: string;
  target_audience: string;
  desired_runtime: string;
  video_tone_style: string;
  reference_videos: string;
  campaign_keywords_or_avoidances: string;
  budget_range: string;
  distribution_channels: string;
  target_regions: string;
  usage_rights_term: string;
  delivery_deadline: string;
  delivery_flexibility: string;
  launch_timing: string;
  brand_description: string;
  brand_mission: string;
  campaign_focus: string;
  product_name: string;
  product_key_features: string;
  market_pain_points: string;
  product_differentiators: string;
  deliverables: string[];
  cutdown_durations: string;
  cutdown_distribution: string;
  social_channels: string;
  social_aspect_ratios: string;
  social_platform_requirements: string;
  stills_type: string;
  photography_requirements: string;
  stills_quantity: string;
  additional_notes: string;
}

/**
 * Computed visibility flags for conditional fields/sections.
 * Derived from current values — step components receive these as props.
 */
export interface CampaignBriefVisibility {
  showReferralSourceOther: boolean;
  showReferrerName: boolean;
  showLaunchTiming: boolean;
  showProductDetails: boolean;
  showCutdownsSection: boolean;
  showSocialSection: boolean;
  showStillsSection: boolean;
}

/** Return type of useCampaignBriefForm — consumed by CampaignBriefForm + step components. */
export interface UseCampaignBriefFormReturn {
  currentStep: number;
  currentStepConfig: CampaignBriefStepConfig;
  steps: CampaignBriefStepConfig[];
  nextStep: () => boolean;
  prevStep: () => void;
  goToStep: (step: number) => void;
  values: CampaignBriefFormValues;
  setFieldValue: (key: CampaignBriefFieldKey, value: string | string[]) => void;
  toggleDeliverable: (option: string) => void;
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

/** Required fields validated when leaving each step via nextStep(). */
const STEP_REQUIRED_FIELDS: Record<number, CampaignBriefFieldKey[]> = {
  1: ['project_title', 'company_name'],
  2: ['contact_name_first', 'contact_name_last', 'contact_email'],
  3: ['budget_range'],
  5: ['campaign_focus'],
};

const ALLOWED_EXTENSIONS = new Set<string>(CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS);

/** Empty initial state for all 42 fields. */
function createInitialValues(): CampaignBriefFormValues {
  return {
    project_title: '',
    company_name: '',
    project_type: '',
    discovery_source: '',
    referral_source_other: '',
    referrer_name: '',
    contact_name_first: '',
    contact_name_last: '',
    contact_job_title: '',
    contact_email: '',
    contact_phone: '',
    campaign_goals: '',
    key_message: '',
    target_audience: '',
    desired_runtime: '',
    video_tone_style: '',
    reference_videos: '',
    campaign_keywords_or_avoidances: '',
    budget_range: '',
    distribution_channels: '',
    target_regions: '',
    usage_rights_term: '',
    delivery_deadline: '',
    delivery_flexibility: '',
    launch_timing: '',
    brand_description: '',
    brand_mission: '',
    campaign_focus: '',
    product_name: '',
    product_key_features: '',
    market_pain_points: '',
    product_differentiators: '',
    deliverables: [],
    cutdown_durations: '',
    cutdown_distribution: '',
    social_channels: '',
    social_aspect_ratios: '',
    social_platform_requirements: '',
    stills_type: '',
    photography_requirements: '',
    stills_quantity: '',
    additional_notes: '',
  };
}

/**
 * Compute conditional field/section visibility from current values.
 * Hidden fields retain their values when toggled off (Gravity Forms behaviour).
 */
function computeVisibility(values: CampaignBriefFormValues): CampaignBriefVisibility {
  return {
    showReferralSourceOther: values.discovery_source === 'Other',
    showReferrerName: REFERRAL_DISCOVERY_SOURCES.has(values.discovery_source),
    showLaunchTiming:
      values.delivery_flexibility === 'Fixed' || values.delivery_flexibility === 'Not sure yet',
    showProductDetails: values.campaign_focus === 'Yes',
    showCutdownsSection: values.deliverables.includes('Cutdowns'),
    showSocialSection: values.deliverables.includes('Social versions'),
    showStillsSection: values.deliverables.includes('Key visuals'),
  };
}

/** Basic email format check — matches API route validation. */
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Lowercase file extension from filename. */
function getExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? (parts.pop()?.toLowerCase() ?? '') : '';
}

/**
 * Validate a set of fields — returns errors object (empty object = valid).
 * Validation only runs on nextStep() or submit(), never on blur.
 */
function validateFields(
  values: CampaignBriefFormValues,
  keys: CampaignBriefFieldKey[],
): CampaignBriefFieldErrors {
  const errors: CampaignBriefFieldErrors = {};

  for (const key of keys) {
    const value = values[key];
    const empty = Array.isArray(value) ? value.length === 0 : !String(value).trim();
    if (empty) {
      errors[key] = 'This field is required.';
    }
  }

  if (keys.includes('contact_email') && values.contact_email && !isValidEmail(values.contact_email)) {
    errors.contact_email = 'Please enter a valid email address.';
  }

  return errors;
}

/**
 * Validate file list — count and extension checks mirror the API route.
 */
function validateFiles(files: File[]): string | null {
  if (files.length > CAMPAIGN_BRIEF_MAX_FILES) {
    return `Maximum ${CAMPAIGN_BRIEF_MAX_FILES} files allowed.`;
  }

  for (const file of files) {
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return `File type not allowed: ${file.name}`;
    }
  }

  return null;
}

/**
 * Build multipart FormData for POST /api/campaign-brief.
 * Includes spam-protection fields consumed by the API route.
 */
function buildFormData(
  values: CampaignBriefFormValues,
  files: File[],
  honeypot: string,
  formStartTime: number,
): FormData {
  const formData = new FormData();

  for (const key of Object.keys(values) as CampaignBriefFieldKey[]) {
    const value = values[key];
    if (key === 'deliverables' && Array.isArray(value)) {
      for (const item of value) {
        formData.append('deliverables', item);
      }
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

/**
 * Push GTM data layer event on successful submission — deduped per page load.
 * Matches legacy gf-brief-datalayer.js behaviour.
 */
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

/**
 * Manages complete Campaign Brief form state: 7 steps, 42 fields,
 * conditional visibility, file uploads, validation, and submission.
 */
export function useCampaignBriefForm(): UseCampaignBriefFormReturn {
  const formStartTimeRef = useRef(Date.now());

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
    () => CAMPAIGN_BRIEF_STEPS.find((s) => s.step === currentStep) ?? CAMPAIGN_BRIEF_STEPS[0],
    [currentStep],
  );

  const isDisabled = submissionState === 'submitting';

  const setFieldValue = useCallback((key: CampaignBriefFieldKey, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleDeliverable = useCallback((option: string) => {
    setValues((prev) => {
      const current = prev.deliverables;
      const next = current.includes(option)
        ? current.filter((d) => d !== option)
        : [...current, option];
      return { ...prev, deliverables: next };
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
    const stepErrors = validateFields(values, stepFields);

    if (Object.keys(stepErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrors }));
      return false;
    }

    setErrors((prev) => {
      const next = { ...prev };
      for (const key of stepFields) {
        delete next[key];
      }
      return next;
    });

    if (currentStep < CAMPAIGN_BRIEF_STEPS.length) {
      setCurrentStep((s) => s + 1);
    }

    return true;
  }, [currentStep, values]);

  const prevStep = useCallback(() => {
    if (currentStep <= 1) return;
    clearStepErrors();
    setCurrentStep((s) => s - 1);
  }, [currentStep, clearStepErrors]);

  /** Jump backward to a completed step — used by step indicator clicks. */
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
      const validationError = validateFiles(combined);

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
    [files],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      const validationError = validateFiles(next);
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
  }, []);

  const submit = useCallback(async () => {
    const fieldErrors = validateFields(values, CAMPAIGN_BRIEF_REQUIRED_FIELDS);
    const filesValidationError = validateFiles(files);

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
        setSubmitError(
          result.error ?? 'Something went wrong. Please try again or email us at info@vantage.pictures',
        );
        setSubmissionState('error');
        return;
      }

      pushBriefSubmitEvent();
      setSubmissionState('success');
    } catch {
      setSubmitError(
        'Something went wrong. Please try again or email us at info@vantage.pictures',
      );
      setSubmissionState('error');
    }
  }, [values, files, honeypot]);

  /** Reset all form state — returns to step 1 for "Submit another brief". */
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
    steps: CAMPAIGN_BRIEF_STEPS,
    nextStep,
    prevStep,
    goToStep,
    values,
    setFieldValue,
    toggleDeliverable,
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
