/**
 * Step 2 — Contact: name, job title, email, phone.
 */

import { CAMPAIGN_BRIEF_FIELD_LABELS } from '@/lib/campaign-brief-fields';
import type { CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import { FormField, FormTextInput } from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
} from '@/components/forms/useCampaignBriefForm';

export interface StepContactProps {
  values: Pick<
    CampaignBriefFormValues,
    | 'contact_name_first'
    | 'contact_name_last'
    | 'contact_job_title'
    | 'contact_email'
    | 'contact_phone'
  >;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  hasError: (key: CampaignBriefFieldKey) => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

export function StepContact({
  values,
  onChange,
  hasError,
  errors,
  disabled,
}: StepContactProps) {
  const labels = CAMPAIGN_BRIEF_FIELD_LABELS;

  return (
    <div className="vp-form-step-grid">
      <div className="vp-form-name-grid">
        <FormField
          label={labels.contact_name_first}
          htmlFor="contact_name_first"
          required
          error={errors.contact_name_first}
        >
          <FormTextInput
            id="contact_name_first"
            name="contact_name_first"
            value={values.contact_name_first}
            onChange={(v) => onChange('contact_name_first', v)}
            disabled={disabled}
            hasError={hasError('contact_name_first')}
            autoComplete="given-name"
          />
        </FormField>

        <FormField
          label={labels.contact_name_last}
          htmlFor="contact_name_last"
          required
          error={errors.contact_name_last}
        >
          <FormTextInput
            id="contact_name_last"
            name="contact_name_last"
            value={values.contact_name_last}
            onChange={(v) => onChange('contact_name_last', v)}
            disabled={disabled}
            hasError={hasError('contact_name_last')}
            autoComplete="family-name"
          />
        </FormField>
      </div>

      <FormField label={labels.contact_job_title} htmlFor="contact_job_title">
        <FormTextInput
          id="contact_job_title"
          name="contact_job_title"
          value={values.contact_job_title}
          onChange={(v) => onChange('contact_job_title', v)}
          disabled={disabled}
          autoComplete="organization-title"
        />
      </FormField>

      <FormField
        label={labels.contact_email}
        htmlFor="contact_email"
        required
        error={errors.contact_email}
      >
        <FormTextInput
          id="contact_email"
          name="contact_email"
          type="email"
          value={values.contact_email}
          onChange={(v) => onChange('contact_email', v)}
          disabled={disabled}
          hasError={hasError('contact_email')}
          autoComplete="email"
        />
      </FormField>

      <FormField label={labels.contact_phone} htmlFor="contact_phone">
        <FormTextInput
          id="contact_phone"
          name="contact_phone"
          type="tel"
          value={values.contact_phone}
          onChange={(v) => onChange('contact_phone', v)}
          disabled={disabled}
          autoComplete="tel"
        />
      </FormField>
    </div>
  );
}
