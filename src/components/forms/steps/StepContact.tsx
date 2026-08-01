/**
 * Step 1 — Contact: name, company, email, discovery source.
 */

import type { CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import type { CampaignBriefUi } from '@/lib/campaign-brief-i18n';
import {
  FormField,
  FormSelect,
  FormTextInput,
} from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
} from '@/components/forms/useCampaignBriefForm';

export interface StepContactProps {
  ui: CampaignBriefUi;
  values: Pick<
    CampaignBriefFormValues,
    | 'contact_name_first'
    | 'contact_name_last'
    | 'company_name'
    | 'contact_email'
    | 'discovery_source'
  >;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  hasError: (key: CampaignBriefFieldKey) => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

export function StepContact({
  ui,
  values,
  onChange,
  hasError,
  errors,
  disabled,
}: StepContactProps) {
  const labels = ui.fieldLabels;
  const hints = ui.hints;

  return (
    <div className="vp-form-grid">
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

      <FormField
        label={labels.company_name}
        htmlFor="company_name"
        required
        error={errors.company_name}
        hint={hints.company_name}
      >
        <FormTextInput
          id="company_name"
          name="company_name"
          value={values.company_name}
          onChange={(v) => onChange('company_name', v)}
          disabled={disabled}
          hasError={hasError('company_name')}
          autoComplete="organization"
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

      <FormField
        label={labels.discovery_source}
        htmlFor="discovery_source"
        fullWidth
      >
        <FormSelect
          id="discovery_source"
          name="discovery_source"
          value={values.discovery_source}
          onChange={(v) => onChange('discovery_source', v)}
          options={ui.discoverySources}
          placeholder={ui.selectPlaceholder}
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}
