/**
 * FormStepIndicator — full-width timeline with connectors and always-visible labels.
 */

import type { CampaignBriefStepConfig } from '@/lib/campaign-brief-fields';
import type { Locale } from '@/i18n/routing';

export interface FormStepIndicatorProps {
  steps: CampaignBriefStepConfig[];
  currentStep: number;
  onGoToStep: (step: number) => void;
  locale?: Locale;
}

type StepState = 'completed' | 'active' | 'pending';

function getStepState(stepNumber: number, currentStep: number): StepState {
  if (stepNumber < currentStep) return 'completed';
  if (stepNumber === currentStep) return 'active';
  return 'pending';
}

export function FormStepIndicator({
  steps,
  currentStep,
  onGoToStep,
  locale = 'en',
}: FormStepIndicatorProps) {
  return (
    <ol className="vp-form-step-progress" aria-label="Form progress">
      {steps.map((step) => {
        const state = getStepState(step.step, currentStep);
        const title = locale === 'zh' ? step.title : step.title.toUpperCase();

        return (
          <li
            key={step.step}
            className={`vp-form-step-progress-item vp-form-step-progress-item--${state}`}
          >
            <div className="vp-form-step-progress-node">
              {state === 'completed' ? (
                <button
                  type="button"
                  className="vp-form-step-progress-circle"
                  onClick={() => onGoToStep(step.step)}
                  aria-label={`Go to step ${step.step}: ${step.title}`}
                >
                  ✓
                </button>
              ) : (
                <span
                  className="vp-form-step-progress-circle"
                  aria-current={state === 'active' ? 'step' : undefined}
                  aria-label={`Step ${step.step}: ${step.title}`}
                >
                  {step.step}
                </span>
              )}

              <span className="vp-form-step-progress-label">{title}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
