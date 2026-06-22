/**
 * FormStepIndicator — desktop text steps (✓/●/○) and mobile numbered circles.
 */

import type { CampaignBriefStepConfig } from '@/lib/campaign-brief-fields';

export interface FormStepIndicatorProps {
  steps: CampaignBriefStepConfig[];
  currentStep: number;
  onGoToStep: (step: number) => void;
}

type StepState = 'completed' | 'active' | 'pending';

function getStepState(stepNumber: number, currentStep: number): StepState {
  if (stepNumber < currentStep) return 'completed';
  if (stepNumber === currentStep) return 'active';
  return 'pending';
}

export function FormStepIndicator({ steps, currentStep, onGoToStep }: FormStepIndicatorProps) {
  return (
    <>
      <ol className="vp-form-step-indicator vp-form-step-indicator--desktop" aria-label="Form progress">
        {steps.map((step) => {
          const state = getStepState(step.step, currentStep);
          const title = step.title.toUpperCase();

          return (
            <li
              key={step.step}
              className={`vp-form-step-item vp-form-step-item--${state}`}
            >
              {state === 'completed' ? (
                <button
                  type="button"
                  className="vp-form-step-link"
                  onClick={() => onGoToStep(step.step)}
                >
                  {title}
                </button>
              ) : (
                <span
                  className={state === 'active' ? 'vp-form-step-label--active' : undefined}
                >
                  {title}
                </span>
              )}
            </li>
          );
        })}
      </ol>

      <ol className="vp-form-step-indicator vp-form-step-indicator--mobile" aria-label="Form progress">
        {steps.map((step) => {
          const state = getStepState(step.step, currentStep);

          return (
            <li key={step.step}>
              {state === 'completed' ? (
                <button
                  type="button"
                  className={`vp-form-step-circle vp-form-step-circle--completed`}
                  onClick={() => onGoToStep(step.step)}
                  aria-label={`Go to step ${step.step}: ${step.title}`}
                >
                  {step.step}
                </button>
              ) : (
                <span
                  className={`vp-form-step-circle vp-form-step-circle--${state}`}
                  aria-current={state === 'active' ? 'step' : undefined}
                  aria-label={`Step ${step.step}: ${step.title}`}
                >
                  {step.step}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}
