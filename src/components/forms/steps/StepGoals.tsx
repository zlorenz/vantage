/**
 * Step 3 — Campaign Goals: objectives, audience, tone, references, budget.
 */

import { BUDGET_RANGE_OPTIONS, CAMPAIGN_BRIEF_FIELD_LABELS } from '@/lib/campaign-brief-fields';
import type { CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import {
  FormField,
  FormRadioGroup,
  FormTextInput,
  FormTextarea,
} from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
} from '@/components/forms/useCampaignBriefForm';

export interface StepGoalsProps {
  values: Pick<
    CampaignBriefFormValues,
    | 'campaign_goals'
    | 'key_message'
    | 'target_audience'
    | 'desired_runtime'
    | 'video_tone_style'
    | 'reference_videos'
    | 'campaign_keywords_or_avoidances'
    | 'budget_range'
  >;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  hasError: (key: CampaignBriefFieldKey) => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

export function StepGoals({
  values,
  onChange,
  hasError,
  errors,
  disabled,
}: StepGoalsProps) {
  const labels = CAMPAIGN_BRIEF_FIELD_LABELS;

  return (
    <div className="vp-form-step-grid">
      <FormField label={labels.campaign_goals} htmlFor="campaign_goals">
        <FormTextarea
          id="campaign_goals"
          name="campaign_goals"
          value={values.campaign_goals}
          onChange={(v) => onChange('campaign_goals', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.key_message} htmlFor="key_message">
        <FormTextarea
          id="key_message"
          name="key_message"
          value={values.key_message}
          onChange={(v) => onChange('key_message', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.target_audience} htmlFor="target_audience">
        <FormTextInput
          id="target_audience"
          name="target_audience"
          value={values.target_audience}
          onChange={(v) => onChange('target_audience', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.desired_runtime} htmlFor="desired_runtime">
        <FormTextInput
          id="desired_runtime"
          name="desired_runtime"
          value={values.desired_runtime}
          onChange={(v) => onChange('desired_runtime', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.video_tone_style} htmlFor="video_tone_style">
        <FormTextarea
          id="video_tone_style"
          name="video_tone_style"
          value={values.video_tone_style}
          onChange={(v) => onChange('video_tone_style', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField label={labels.reference_videos} htmlFor="reference_videos">
        <FormTextarea
          id="reference_videos"
          name="reference_videos"
          value={values.reference_videos}
          onChange={(v) => onChange('reference_videos', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField
        label={labels.campaign_keywords_or_avoidances}
        htmlFor="campaign_keywords_or_avoidances"
      >
        <FormTextInput
          id="campaign_keywords_or_avoidances"
          name="campaign_keywords_or_avoidances"
          value={values.campaign_keywords_or_avoidances}
          onChange={(v) => onChange('campaign_keywords_or_avoidances', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField
        label={labels.budget_range}
        htmlFor="budget_range"
        required
        error={errors.budget_range}
      >
        <FormRadioGroup
          name="budget_range"
          value={values.budget_range}
          options={BUDGET_RANGE_OPTIONS}
          onChange={(v) => onChange('budget_range', v)}
          disabled={disabled}
          hasError={hasError('budget_range')}
        />
      </FormField>
    </div>
  );
}
