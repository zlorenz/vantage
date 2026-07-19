/**
 * Step 5 — Brand / Product: brand description, mission, product focus, product details.
 */

import type { CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import type { CampaignBriefUi } from '@/lib/campaign-brief-i18n';
import {
  FormField,
  FormRadioGroup,
  FormSectionHeader,
  FormTextInput,
  FormTextarea,
} from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
  CampaignBriefVisibility,
} from '@/components/forms/useCampaignBriefForm';

export interface StepBrandProps {
  ui: CampaignBriefUi;
  values: Pick<
    CampaignBriefFormValues,
    | 'brand_description'
    | 'brand_mission'
    | 'campaign_focus'
    | 'product_name'
    | 'product_key_features'
    | 'market_pain_points'
    | 'product_differentiators'
  >;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  visibility: Pick<CampaignBriefVisibility, 'showProductDetails'>;
  hasError: (key: CampaignBriefFieldKey) => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

export function StepBrand({
  ui,
  values,
  onChange,
  visibility,
  hasError,
  errors,
  disabled,
}: StepBrandProps) {
  const labels = ui.fieldLabels;
  const hints = ui.hints;

  return (
    <div className="vp-form-grid">
      <FormField
        label={labels.brand_description}
        htmlFor="brand_description"
        hint={hints.brand_description}
      >
        <FormTextarea
          id="brand_description"
          name="brand_description"
          value={values.brand_description}
          onChange={(v) => onChange('brand_description', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField
        label={labels.brand_mission}
        htmlFor="brand_mission"
        hint={hints.brand_mission}
      >
        <FormTextarea
          id="brand_mission"
          name="brand_mission"
          value={values.brand_mission}
          onChange={(v) => onChange('brand_mission', v)}
          disabled={disabled}
        />
      </FormField>

      <FormField
        label={labels.campaign_focus}
        htmlFor="campaign_focus"
        required
        error={errors.campaign_focus}
        fullWidth
      >
        <FormRadioGroup
          name="campaign_focus"
          value={values.campaign_focus}
          options={ui.campaignFocus}
          onChange={(v) => onChange('campaign_focus', v)}
          disabled={disabled}
          hasError={hasError('campaign_focus')}
        />
      </FormField>

      {visibility.showProductDetails && (
        <>
          <FormSectionHeader title={ui.sections.productDetails} />

          <FormField
            label={labels.product_name}
            htmlFor="product_name"
            fullWidth
            hint={hints.product_name}
          >
            <FormTextInput
              id="product_name"
              name="product_name"
              value={values.product_name}
              onChange={(v) => onChange('product_name', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.product_key_features}
            htmlFor="product_key_features"
            hint={hints.product_key_features}
          >
            <FormTextarea
              id="product_key_features"
              name="product_key_features"
              value={values.product_key_features}
              onChange={(v) => onChange('product_key_features', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.market_pain_points}
            htmlFor="market_pain_points"
            hint={hints.market_pain_points}
          >
            <FormTextarea
              id="market_pain_points"
              name="market_pain_points"
              value={values.market_pain_points}
              onChange={(v) => onChange('market_pain_points', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.product_differentiators}
            htmlFor="product_differentiators"
            fullWidth
            hint={hints.product_differentiators}
          >
            <FormTextarea
              id="product_differentiators"
              name="product_differentiators"
              value={values.product_differentiators}
              onChange={(v) => onChange('product_differentiators', v)}
              disabled={disabled}
            />
          </FormField>
        </>
      )}
    </div>
  );
}
