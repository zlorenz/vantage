'use client';

/**
 * CampaignBriefForm — 7-step client form shell with step indicator, navigation,
 * honeypot, submission states, and GTM event on success.
 * Copy is locale-aware via getCampaignBriefUi (EN option values preserved for API).
 */

import { useLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import { getCampaignBriefUi } from '@/lib/campaign-brief-i18n';
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

export function CampaignBriefForm() {
  const locale = useLocale() as Locale;
  const ui = getCampaignBriefUi(locale);
  const form = useCampaignBriefForm(locale);
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
          <p>{ui.successMessage}</p>
          <div className="vp-form-success-actions">
            <button type="button" className="vp-form-reset-link" onClick={resetForm}>
              {ui.submitAnother}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stepTitle =
    locale === 'zh' ? currentStepConfig.title : currentStepConfig.title.toUpperCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 7) {
      void submit();
    }
  };

  const renderStep = () => {
    const shared = {
      ui,
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
      <FormStepIndicator
        steps={steps}
        currentStep={currentStep}
        onGoToStep={goToStep}
        locale={locale}
      />

      <h2 className="vp-form-step-heading">
        <span className="vp-form-step-count">{ui.stepCount(currentStep)}</span>
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
            {ui.submitError.includes('info@vantage.pictures') ? (
              <>
                {ui.submitError.split('info@vantage.pictures')[0]}
                <a href="mailto:info@vantage.pictures">info@vantage.pictures</a>
              </>
            ) : (
              ui.submitError
            )}
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
              {ui.previous}
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
              {ui.next}
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
                {ui.submitBrief}
              </span>
            </VpButton>
          )}
        </nav>
      </form>
    </div>
  );
}
