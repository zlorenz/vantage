/**
 * Step 6 — Deliverables: checkbox list and conditional cutdowns, social, stills sections.
 */

import { DELIVERABLES_OPTIONS, CAMPAIGN_BRIEF_FIELD_LABELS } from '@/lib/campaign-brief-fields';
import type { CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import {
  FormCheckboxGroup,
  FormField,
  FormSectionHeader,
  FormTextInput,
  FormTextarea,
} from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
  CampaignBriefVisibility,
} from '@/components/forms/useCampaignBriefForm';

export interface StepDeliverablesProps {
  values: Pick<
    CampaignBriefFormValues,
    | 'deliverables'
    | 'cutdown_durations'
    | 'cutdown_distribution'
    | 'social_channels'
    | 'social_aspect_ratios'
    | 'social_platform_requirements'
    | 'stills_type'
    | 'photography_requirements'
    | 'stills_quantity'
  >;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  onToggleDeliverable: (option: string) => void;
  visibility: Pick<
    CampaignBriefVisibility,
    'showCutdownsSection' | 'showSocialSection' | 'showStillsSection'
  >;
  hasError: (key: CampaignBriefFieldKey) => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

export function StepDeliverables({
  values,
  onChange,
  onToggleDeliverable,
  visibility,
  hasError,
  errors,
  disabled,
}: StepDeliverablesProps) {
  const labels = CAMPAIGN_BRIEF_FIELD_LABELS;

  return (
    <div className="vp-form-step-grid">
      <FormField label={labels.deliverables} htmlFor="deliverables">
        <FormCheckboxGroup
          name="deliverables"
          values={values.deliverables}
          options={DELIVERABLES_OPTIONS}
          onToggle={onToggleDeliverable}
          disabled={disabled}
          hasError={hasError('deliverables')}
        />
      </FormField>

      {visibility.showCutdownsSection && (
        <>
          <FormSectionHeader title="Cutdowns" />

          <FormField label={labels.cutdown_durations} htmlFor="cutdown_durations">
            <FormTextInput
              id="cutdown_durations"
              name="cutdown_durations"
              value={values.cutdown_durations}
              onChange={(v) => onChange('cutdown_durations', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField label={labels.cutdown_distribution} htmlFor="cutdown_distribution">
            <FormTextInput
              id="cutdown_distribution"
              name="cutdown_distribution"
              value={values.cutdown_distribution}
              onChange={(v) => onChange('cutdown_distribution', v)}
              disabled={disabled}
            />
          </FormField>
        </>
      )}

      {visibility.showSocialSection && (
        <>
          <FormSectionHeader title="Social Versions" />

          <FormField label={labels.social_channels} htmlFor="social_channels">
            <FormTextInput
              id="social_channels"
              name="social_channels"
              value={values.social_channels}
              onChange={(v) => onChange('social_channels', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField label={labels.social_aspect_ratios} htmlFor="social_aspect_ratios">
            <FormTextInput
              id="social_aspect_ratios"
              name="social_aspect_ratios"
              value={values.social_aspect_ratios}
              onChange={(v) => onChange('social_aspect_ratios', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.social_platform_requirements}
            htmlFor="social_platform_requirements"
          >
            <FormTextarea
              id="social_platform_requirements"
              name="social_platform_requirements"
              value={values.social_platform_requirements}
              onChange={(v) => onChange('social_platform_requirements', v)}
              disabled={disabled}
            />
          </FormField>
        </>
      )}

      {visibility.showStillsSection && (
        <>
          <FormSectionHeader title="Stills / Key Visuals" />

          <FormField label={labels.stills_type} htmlFor="stills_type">
            <FormTextarea
              id="stills_type"
              name="stills_type"
              value={values.stills_type}
              onChange={(v) => onChange('stills_type', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.photography_requirements}
            htmlFor="photography_requirements"
          >
            <FormTextarea
              id="photography_requirements"
              name="photography_requirements"
              value={values.photography_requirements}
              onChange={(v) => onChange('photography_requirements', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField label={labels.stills_quantity} htmlFor="stills_quantity">
            <FormTextInput
              id="stills_quantity"
              name="stills_quantity"
              value={values.stills_quantity}
              onChange={(v) => onChange('stills_quantity', v)}
              disabled={disabled}
            />
          </FormField>
        </>
      )}

    </div>
  );
}
