/**
 * Step 4 — Timeline & Release: distribution, regions, rights, deadline, flexibility.
 */

import {
  DELIVERY_FLEXIBILITY_OPTIONS,
  CAMPAIGN_BRIEF_FIELD_LABELS,
} from '@/lib/campaign-brief-fields';
import type { CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import {
  FormField,
  FormRadioGroup,
  FormTextInput,
} from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
  CampaignBriefVisibility,
} from '@/components/forms/useCampaignBriefForm';

export interface StepTimelineProps {
  values: Pick<
    CampaignBriefFormValues,
    | 'distribution_channels'
    | 'target_regions'
    | 'usage_rights_term'
    | 'delivery_deadline'
    | 'delivery_flexibility'
    | 'launch_timing'
  >;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  visibility: Pick<CampaignBriefVisibility, 'showLaunchTiming'>;
  hasError: (key: CampaignBriefFieldKey) => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

export function StepTimeline({
  values,
  onChange,
  visibility,
  hasError,
  errors,
  disabled,
}: StepTimelineProps) {
  const labels = CAMPAIGN_BRIEF_FIELD_LABELS;

  return (
    <div className="vp-form-step-grid">
      <FormField label={labels.distribution_channels} htmlFor="distribution_channels">
        <FormTextInput
          id="distribution_channels"
          name="distribution_channels"
          value={values.distribution_channels}
          onChange={(v) => onChange('distribution_channels', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.target_regions} htmlFor="target_regions">
        <FormTextInput
          id="target_regions"
          name="target_regions"
          value={values.target_regions}
          onChange={(v) => onChange('target_regions', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.usage_rights_term} htmlFor="usage_rights_term">
        <FormTextInput
          id="usage_rights_term"
          name="usage_rights_term"
          value={values.usage_rights_term}
          onChange={(v) => onChange('usage_rights_term', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.delivery_deadline} htmlFor="delivery_deadline">
        <FormTextInput
          id="delivery_deadline"
          name="delivery_deadline"
          value={values.delivery_deadline}
          onChange={(v) => onChange('delivery_deadline', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.delivery_flexibility} htmlFor="delivery_flexibility">
        <FormRadioGroup
          name="delivery_flexibility"
          value={values.delivery_flexibility}
          options={DELIVERY_FLEXIBILITY_OPTIONS}
          onChange={(v) => onChange('delivery_flexibility', v)}
          disabled={disabled}
          hasError={hasError('delivery_flexibility')}
        />
      </FormField>

      {visibility.showLaunchTiming && (
        <FormField
          label={labels.launch_timing}
          htmlFor="launch_timing"
          error={errors.launch_timing}
        >
          <FormTextInput
            id="launch_timing"
            name="launch_timing"
            value={values.launch_timing}
            onChange={(v) => onChange('launch_timing', v)}
            disabled={disabled}
            hasError={hasError('launch_timing')}
          />
        </FormField>
      )}
    </div>
  );
}
