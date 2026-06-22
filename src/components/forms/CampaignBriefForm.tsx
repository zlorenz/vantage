'use client';

/**
 * PHASE B: Chinese form
 * ─────────────────────
 * When Chinese translations are ready, build the fully translated variant at:
 *   Route: /zh/视频活动简介/ (routing already exists in i18n/routing.ts)
 *
 * Scope for Phase B:
 * - All 42 field labels translated
 * - All 7 step titles translated (step indicator + "STEP X OF 7" heading)
 * - All select / radio / checkbox option labels translated
 * - Form description paragraph translated (CAMPAIGN_BRIEF_FORM_DESCRIPTION)
 * - Confirmation message translated (CAMPAIGN_BRIEF_SUCCESS_MESSAGE)
 * - Validation error messages translated
 * - Navigation button labels translated (Previous, Next, Submit Brief, Submit another brief)
 * - Section headers translated (Product Details, Cutdowns, Social Versions, Stills / Key Visuals)
 *
 * Reuse the same component architecture, useCampaignBriefForm hook, API route, and
 * submission pipeline as this English form. Pass locale-specific copy via props or
 * a translations map — do not duplicate form logic.
 */

import { CAMPAIGN_BRIEF_SUCCESS_MESSAGE } from '@/lib/campaign-brief-fields';
import { VpButton } from '@/components/ui/VpButton';
import { FormStepIndicator } from '@/components/forms/FormStepIndicator';
import { useCampaignBriefForm } from '@/components/forms/useCampaignBriefForm';
import {
  StepBasics,
  StepBrand,
  StepContact,
  StepDeliverables,
  StepFinalNotes,
  StepGoals,
  StepTimeline,
} from '@/components/forms/steps';
import '@/components/forms/campaign-brief-form.css';

/**
 * CampaignBriefForm — 7-step client form shell with step indicator, navigation,
 * honeypot, submission states, and GTM event on success.
 */
export function CampaignBriefForm() {
  const form = useCampaignBriefForm();
  const {
    currentStep,
    currentStepConfig,
    steps,
    nextStep,
    prevStep,
    goToStep,
    values,
    setFieldValue,
    toggleDeliverable,
    visibility,
    errors,
    hasError,
    files,
    addFiles,
    removeFile,
    fileError,
    submissionState,
    submit,
    resetForm,
    isDisabled,
    honeypot,
    setHoneypot,
  } = form;

  if (submissionState === 'success') {
    return (
      <div className="vp-form-shell">
        <div className="vp-form-success" role="status">
          <p>{CAMPAIGN_BRIEF_SUCCESS_MESSAGE}</p>
          <div className="vp-form-success-actions">
            <button type="button" className="vp-form-reset-link" onClick={resetForm}>
              Submit another brief
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepTitle = currentStepConfig.title.toUpperCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 7) {
      void submit();
    }
  };

  const renderStep = () => {
    const shared = {
      onChange: setFieldValue,
      hasError,
      errors,
      disabled: isDisabled,
    };

    switch (currentStep) {
      case 1:
        return (
          <StepBasics
            values={values}
            visibility={visibility}
            {...shared}
          />
        );
      case 2:
        return <StepContact values={values} {...shared} />;
      case 3:
        return <StepGoals values={values} {...shared} />;
      case 4:
        return (
          <StepTimeline
            values={values}
            visibility={visibility}
            {...shared}
          />
        );
      case 5:
        return (
          <StepBrand
            values={values}
            visibility={visibility}
            {...shared}
          />
        );
      case 6:
        return (
          <StepDeliverables
            values={values}
            visibility={visibility}
            onToggleDeliverable={toggleDeliverable}
            {...shared}
          />
        );
      case 7:
        return (
          <StepFinalNotes
            values={values}
            files={files}
            onAddFiles={addFiles}
            onRemoveFile={removeFile}
            fileError={fileError}
            {...shared}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="vp-form-shell">
      <FormStepIndicator steps={steps} currentStep={currentStep} onGoToStep={goToStep} />

      <h2 className="vp-form-step-heading">
        <span className="vp-form-step-count">STEP {currentStep} OF 7</span>
        {stepTitle}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        <input
          type="text"
          name="website"
          className="vp-form-honeypot"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <fieldset disabled={isDisabled} className="min-w-0 border-0 p-0">
          {renderStep()}
        </fieldset>

        {submissionState === 'error' && (
          <div className="vp-form-error-banner" role="alert">
            Something went wrong. Please try again or email us at{' '}
            <a href="mailto:info@vantage.pictures">info@vantage.pictures</a>
          </div>
        )}

        <nav className="vp-form-nav" aria-label="Form navigation">
          {currentStep > 1 && (
            <VpButton
              type="button"
              variant="ghost"
              className="vp-form-nav-btn"
              disabled={isDisabled}
              onClick={prevStep}
            >
              Previous
            </VpButton>
          )}

          {currentStep < 7 && (
            <VpButton
              type="button"
              variant="primary"
              className="vp-form-nav-btn"
              disabled={isDisabled}
              onClick={nextStep}
            >
              Next
            </VpButton>
          )}

          {currentStep === 7 && (
            <VpButton
              type="submit"
              variant="primary"
              className="vp-form-nav-btn"
              disabled={isDisabled}
            >
              <span className="vp-form-nav-btn-inner">
                {submissionState === 'submitting' && (
                  <span className="vp-form-submit-spinner" aria-hidden="true" />
                )}
                Submit Brief
              </span>
            </VpButton>
          )}
        </nav>
      </form>
    </div>
  );
}
