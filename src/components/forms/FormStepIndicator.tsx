/**
 * FormStepIndicator — compact numbered-circle progress row matching the live site.
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
    <ol className="vp-form-step-progress" aria-label="Form progress">
      {steps.map((step) => {
        const state = getStepState(step.step, currentStep);
        const title = step.title.toUpperCase();

        return (
          <li
            key={step.step}
            className={`vp-form-step-progress-item vp-form-step-progress-item--${state}`}
          >
            {state === 'completed' ? (
              <button
                type="button"
                className="vp-form-step-progress-circle"
                title={title}
                onClick={() => onGoToStep(step.step)}
                aria-label={`Go to step ${step.step}: ${step.title}`}
              >
                ✓
              </button>
            ) : (
              <span
                className="vp-form-step-progress-circle"
                title={title}
                aria-current={state === 'active' ? 'step' : undefined}
                aria-label={`Step ${step.step}: ${step.title}`}
              >
                {state === 'active' ? step.step : ''}
              </span>
            )}

            {state === 'active' && (
              <span className="vp-form-step-progress-label">{title}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
