/**
 * Step 2 — Campaign Details: shared title/type + branch fieldsets by campaign_type.
 */

import { useLocale } from 'next-intl';
import type { CampaignBriefArrayFieldKey, CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import type { CampaignBriefUi } from '@/lib/campaign-brief-i18n';
import {
  getProjectDescriptionHint,
  getTargetAudienceHint,
} from '@/lib/campaign-brief-i18n';
import type { Locale } from '@/i18n/routing';
import {
  FormCheckboxGroup,
  FormDateField,
  FormField,
  FormRadioGroup,
  FormSelect,
  FormTextInput,
  FormTextarea,
} from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
  CampaignBriefVisibility,
} from '@/components/forms/useCampaignBriefForm';

export interface StepCampaignDetailsProps {
  ui: CampaignBriefUi;
  values: CampaignBriefFormValues;
  visibility: CampaignBriefVisibility;
  onChange: (key: CampaignBriefFieldKey, value: string | string[] | boolean) => void;
  onToggleArray: (key: CampaignBriefArrayFieldKey, option: string) => void;
  hasError: (key: CampaignBriefFieldKey) => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

export function StepCampaignDetails({
  ui,
  values,
  visibility,
  onChange,
  onToggleArray,
  hasError,
  errors,
  disabled,
}: StepCampaignDetailsProps) {
  const locale = useLocale() as Locale;
  const labels = ui.fieldLabels;
  const hints = ui.hints;
  const budgetOptions = ui.budgetOptionsForType(values.campaign_type);

  const dateUnknownProps = {
    unknownLabel: labels.delivery_deadline_unknown,
    notePlaceholder: labels.delivery_deadline_note,
  };

  return (
    <div className="vp-form-grid">
      <FormField
        label={labels.campaign_title}
        htmlFor="campaign_title"
        required
        error={errors.campaign_title}
        hint={hints.campaign_title}
      >
        <FormTextInput
          id="campaign_title"
          name="campaign_title"
          value={values.campaign_title}
          onChange={(v) => onChange('campaign_title', v)}
          disabled={disabled}
          hasError={hasError('campaign_title')}
        />
      </FormField>

      <FormField
        label={labels.campaign_type}
        htmlFor="campaign_type"
        required
        error={errors.campaign_type}
        hint={hints.campaign_type}
      >
        <FormSelect
          id="campaign_type"
          name="campaign_type"
          value={values.campaign_type}
          onChange={(v) => onChange('campaign_type', v)}
          options={ui.campaignTypes}
          placeholder={ui.selectPlaceholder}
          disabled={disabled}
          hasError={hasError('campaign_type')}
        />
      </FormField>

      {visibility.showProductBranch && (
        <>
          <FormField
            label={labels.brand_description}
            htmlFor="brand_description"
            hint={hints.brand_description}
            fullWidth
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
            label={labels.product_description}
            htmlFor="product_description"
            hint={hints.product_description}
            fullWidth
          >
            <FormTextarea
              id="product_description"
              name="product_description"
              value={values.product_description}
              onChange={(v) => onChange('product_description', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.campaign_description}
            htmlFor="campaign_description"
            hint={hints.campaign_description}
          >
            <FormTextarea
              id="campaign_description"
              name="campaign_description"
              value={values.campaign_description}
              onChange={(v) => onChange('campaign_description', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.reference_videos}
            htmlFor="reference_videos"
            hint={hints.reference_videos}
          >
            <FormTextarea
              id="reference_videos"
              name="reference_videos"
              value={values.reference_videos}
              onChange={(v) => onChange('reference_videos', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.target_audience}
            htmlFor="target_audience"
            hint={hints.target_audience}
          >
            <FormTextInput
              id="target_audience"
              name="target_audience"
              value={values.target_audience}
              onChange={(v) => onChange('target_audience', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.delivery_deadline}
            htmlFor="delivery_deadline"
          >
            <FormDateField
              id="delivery_deadline"
              name="delivery_deadline"
              dateValue={values.delivery_deadline}
              unknown={values.delivery_deadline_unknown}
              noteValue={values.delivery_deadline_note}
              onDateChange={(v) => onChange('delivery_deadline', v)}
              onUnknownChange={(v) => onChange('delivery_deadline_unknown', v)}
              onNoteChange={(v) => onChange('delivery_deadline_note', v)}
              disabled={disabled}
              {...dateUnknownProps}
            />
          </FormField>

          <FormField
            label={labels.extra_deliverables}
            htmlFor="extra_deliverables"
            hint={hints.extra_deliverables}
            hintBeforeControls
          >
            <FormCheckboxGroup
              name="extra_deliverables"
              values={values.extra_deliverables}
              options={ui.extraDeliverables}
              onToggle={(option) => onToggleArray('extra_deliverables', option)}
              disabled={disabled}
              optionExtra={{
                value: 'Other',
                content: (
                  <FormTextInput
                    id="extra_deliverables_other_note"
                    name="extra_deliverables_other_note"
                    value={values.extra_deliverables_other_note}
                    onChange={(v) => onChange('extra_deliverables_other_note', v)}
                    disabled={disabled}
                    placeholder={labels.extra_deliverables_other_note}
                    className="vp-form-control--compact"
                  />
                ),
              }}
            />
          </FormField>
        </>
      )}

      {visibility.showBrandingBranch && (
        <>
          <FormField
            label={labels.brand_description}
            htmlFor="brand_description"
            hint={hints.brand_description}
            fullWidth
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
            label={labels.campaign_description}
            htmlFor="campaign_description"
            hint={hints.campaign_description}
          >
            <FormTextarea
              id="campaign_description"
              name="campaign_description"
              value={values.campaign_description}
              onChange={(v) => onChange('campaign_description', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.reference_videos}
            htmlFor="reference_videos"
            hint={hints.reference_videos}
          >
            <FormTextarea
              id="reference_videos"
              name="reference_videos"
              value={values.reference_videos}
              onChange={(v) => onChange('reference_videos', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.target_audience}
            htmlFor="target_audience"
            hint={hints.target_audience}
          >
            <FormTextInput
              id="target_audience"
              name="target_audience"
              value={values.target_audience}
              onChange={(v) => onChange('target_audience', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.delivery_deadline}
            htmlFor="delivery_deadline"
          >
            <FormDateField
              id="delivery_deadline"
              name="delivery_deadline"
              dateValue={values.delivery_deadline}
              unknown={values.delivery_deadline_unknown}
              noteValue={values.delivery_deadline_note}
              onDateChange={(v) => onChange('delivery_deadline', v)}
              onUnknownChange={(v) => onChange('delivery_deadline_unknown', v)}
              onNoteChange={(v) => onChange('delivery_deadline_note', v)}
              disabled={disabled}
              {...dateUnknownProps}
            />
          </FormField>

          <FormField
            label={labels.extra_deliverables}
            htmlFor="extra_deliverables"
            hint={hints.extra_deliverables}
            hintBeforeControls
          >
            <FormCheckboxGroup
              name="extra_deliverables"
              values={values.extra_deliverables}
              options={ui.extraDeliverables}
              onToggle={(option) => onToggleArray('extra_deliverables', option)}
              disabled={disabled}
              optionExtra={{
                value: 'Other',
                content: (
                  <FormTextInput
                    id="extra_deliverables_other_note"
                    name="extra_deliverables_other_note"
                    value={values.extra_deliverables_other_note}
                    onChange={(v) => onChange('extra_deliverables_other_note', v)}
                    disabled={disabled}
                    placeholder={labels.extra_deliverables_other_note}
                    className="vp-form-control--compact"
                  />
                ),
              }}
            />
          </FormField>
        </>
      )}

      {visibility.showDocumentaryBranch && (
        <>
          <FormField
            label={labels.project_description}
            htmlFor="project_description"
            hint={getProjectDescriptionHint(locale, values.campaign_type)}
            fullWidth
          >
            <FormTextarea
              id="project_description"
              name="project_description"
              value={values.project_description}
              onChange={(v) => onChange('project_description', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.reference_videos}
            htmlFor="reference_videos"
            hint={hints.reference_videos}
            fullWidth
          >
            <FormTextarea
              id="reference_videos"
              name="reference_videos"
              value={values.reference_videos}
              onChange={(v) => onChange('reference_videos', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.shoot_event_date}
            htmlFor="shoot_event_date"
          >
            <FormDateField
              id="shoot_event_date"
              name="shoot_event_date"
              dateValue={values.shoot_event_date}
              unknown={values.shoot_event_date_unknown}
              noteValue={values.shoot_event_date_note}
              onDateChange={(v) => onChange('shoot_event_date', v)}
              onUnknownChange={(v) => onChange('shoot_event_date_unknown', v)}
              onNoteChange={(v) => onChange('shoot_event_date_note', v)}
              unknownLabel={labels.shoot_event_date_unknown}
              notePlaceholder={labels.shoot_event_date_note}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.production_scope}
            htmlFor="production_scope"
            hint={hints.production_scope}
          >
            <FormSelect
              id="production_scope"
              name="production_scope"
              value={values.production_scope}
              onChange={(v) => onChange('production_scope', v)}
              options={ui.productionScopes}
              placeholder={ui.selectPlaceholder}
              disabled={disabled}
            />
          </FormField>

          {visibility.showPostProdDeadline && (
            <FormField
              label={labels.delivery_deadline}
              htmlFor="delivery_deadline"
            >
              <FormDateField
                id="delivery_deadline"
                name="delivery_deadline"
                dateValue={values.delivery_deadline}
                unknown={values.delivery_deadline_unknown}
                noteValue={values.delivery_deadline_note}
                onDateChange={(v) => onChange('delivery_deadline', v)}
                onUnknownChange={(v) => onChange('delivery_deadline_unknown', v)}
                onNoteChange={(v) => onChange('delivery_deadline_note', v)}
                disabled={disabled}
                {...dateUnknownProps}
              />
            </FormField>
          )}
        </>
      )}

      {visibility.showSocialBranch && (
        <>
          <FormField
            label={labels.brand_description}
            htmlFor="brand_description"
            hint={hints.brand_description}
            fullWidth
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
            label={ui.campaignDescriptionSocialLabel}
            htmlFor="campaign_description"
            hint={ui.campaignDescriptionSocialHint}
            fullWidth
          >
            <FormTextarea
              id="campaign_description"
              name="campaign_description"
              value={values.campaign_description}
              onChange={(v) => onChange('campaign_description', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.target_audience}
            htmlFor="target_audience"
            hint={getTargetAudienceHint(locale, values.campaign_type)}
          >
            <FormTextInput
              id="target_audience"
              name="target_audience"
              value={values.target_audience}
              onChange={(v) => onChange('target_audience', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.delivery_deadline}
            htmlFor="delivery_deadline"
          >
            <FormDateField
              id="delivery_deadline"
              name="delivery_deadline"
              dateValue={values.delivery_deadline}
              unknown={values.delivery_deadline_unknown}
              noteValue={values.delivery_deadline_note}
              onDateChange={(v) => onChange('delivery_deadline', v)}
              onUnknownChange={(v) => onChange('delivery_deadline_unknown', v)}
              onNoteChange={(v) => onChange('delivery_deadline_note', v)}
              disabled={disabled}
              {...dateUnknownProps}
            />
          </FormField>

          <FormField
            label={labels.social_channels}
            htmlFor="social_channels"
            hint={hints.social_channels}
            hintBeforeControls
          >
            <FormCheckboxGroup
              name="social_channels"
              values={values.social_channels}
              options={ui.socialChannels}
              onToggle={(option) => onToggleArray('social_channels', option)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.aspect_ratios}
            htmlFor="aspect_ratios"
            hint={hints.aspect_ratios}
            hintBeforeControls
          >
            <FormCheckboxGroup
              name="aspect_ratios"
              values={values.aspect_ratios}
              options={ui.aspectRatios}
              onToggle={(option) => onToggleArray('aspect_ratios', option)}
              disabled={disabled}
            />
          </FormField>
        </>
      )}

      {visibility.showOtherBranch && (
        <>
          <FormField
            label={labels.project_description}
            htmlFor="project_description"
            hint={getProjectDescriptionHint(locale, values.campaign_type)}
            fullWidth
          >
            <FormTextarea
              id="project_description"
              name="project_description"
              value={values.project_description}
              onChange={(v) => onChange('project_description', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.reference_videos}
            htmlFor="reference_videos"
            hint={hints.reference_videos}
            fullWidth
          >
            <FormTextarea
              id="reference_videos"
              name="reference_videos"
              value={values.reference_videos}
              onChange={(v) => onChange('reference_videos', v)}
              disabled={disabled}
            />
          </FormField>

          <FormField
            label={labels.delivery_deadline}
            htmlFor="delivery_deadline"
          >
            <FormDateField
              id="delivery_deadline"
              name="delivery_deadline"
              dateValue={values.delivery_deadline}
              unknown={values.delivery_deadline_unknown}
              noteValue={values.delivery_deadline_note}
              onDateChange={(v) => onChange('delivery_deadline', v)}
              onUnknownChange={(v) => onChange('delivery_deadline_unknown', v)}
              onNoteChange={(v) => onChange('delivery_deadline_note', v)}
              disabled={disabled}
              {...dateUnknownProps}
            />
          </FormField>
        </>
      )}

      {values.campaign_type !== '' && (
        <FormField
          label={labels.budget_range}
          htmlFor="budget_range"
          required
          error={errors.budget_range}
          hint={hints.budget_range}
          hintBeforeControls
        >
          <FormRadioGroup
            name="budget_range"
            value={values.budget_range}
            options={budgetOptions}
            onChange={(v) => onChange('budget_range', v)}
            disabled={disabled}
            hasError={hasError('budget_range')}
          />
        </FormField>
      )}
    </div>
  );
}
