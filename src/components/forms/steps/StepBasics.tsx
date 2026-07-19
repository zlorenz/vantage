/**
 * Step 1 — Basics: project title, company, project type, discovery source, referral fields.
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
  CampaignBriefVisibility,
} from '@/components/forms/useCampaignBriefForm';

export interface StepBasicsProps {
  ui: CampaignBriefUi;
  values: Pick<
    CampaignBriefFormValues,
    | 'project_title'
    | 'company_name'
    | 'project_type'
    | 'discovery_source'
    | 'referral_source_other'
    | 'referrer_name'
  >;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  visibility: Pick<CampaignBriefVisibility, 'showReferralSourceOther' | 'showReferrerName'>;
  hasError: (key: CampaignBriefFieldKey) => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

export function StepBasics({
  ui,
  values,
  onChange,
  visibility,
  hasError,
  errors,
  disabled,
}: StepBasicsProps) {
  const labels = ui.fieldLabels;
  const hints = ui.hints;

  return (
    <div className="vp-form-grid">
      <FormField
        label={labels.project_title}
        htmlFor="project_title"
        required
        error={errors.project_title}
        hint={hints.project_title}
      >
        <FormTextInput
          id="project_title"
          name="project_title"
          value={values.project_title}
          onChange={(v) => onChange('project_title', v)}
          disabled={disabled}
          hasError={hasError('project_title')}
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
        />
      </FormField>

      <FormField label={labels.project_type} htmlFor="project_type">
        <FormSelect
          id="project_type"
          name="project_type"
          value={values.project_type}
          onChange={(v) => onChange('project_type', v)}
          options={ui.projectTypes}
          placeholder={ui.selectPlaceholder}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.discovery_source} htmlFor="discovery_source">
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

      {visibility.showReferralSourceOther && (
        <FormField
          label={labels.referral_source_other}
          htmlFor="referral_source_other"
          error={errors.referral_source_other}
          fullWidth
        >
          <FormTextInput
            id="referral_source_other"
            name="referral_source_other"
            value={values.referral_source_other}
            onChange={(v) => onChange('referral_source_other', v)}
            disabled={disabled}
            hasError={hasError('referral_source_other')}
          />
        </FormField>
      )}

      {visibility.showReferrerName && (
        <FormField
          label={labels.referrer_name}
          htmlFor="referrer_name"
          error={errors.referrer_name}
          fullWidth
        >
          <FormTextInput
            id="referrer_name"
            name="referrer_name"
            value={values.referrer_name}
            onChange={(v) => onChange('referrer_name', v)}
            disabled={disabled}
            hasError={hasError('referrer_name')}
          />
        </FormField>
      )}
    </div>
  );
}
