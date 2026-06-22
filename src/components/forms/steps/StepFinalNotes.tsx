'use client';

/**
 * Step 7 — Final Notes: additional notes textarea and briefing materials file upload.
 */

import { useRef } from 'react';
import {
  CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS,
  CAMPAIGN_BRIEF_FIELD_LABELS,
} from '@/lib/campaign-brief-fields';
import type { CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import { FormField, FormTextarea } from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
} from '@/components/forms/useCampaignBriefForm';

export interface StepFinalNotesProps {
  values: Pick<CampaignBriefFormValues, 'additional_notes'>;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  files: File[];
  onAddFiles: (files: FileList) => void;
  onRemoveFile: (index: number) => void;
  fileError: string | null;
  hasError: (key: CampaignBriefFieldKey | 'files') => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

const ACCEPTED_FILE_TYPES = CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

export function StepFinalNotes({
  values,
  onChange,
  files,
  onAddFiles,
  onRemoveFile,
  fileError,
  hasError,
  errors,
  disabled,
}: StepFinalNotesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const labels = CAMPAIGN_BRIEF_FIELD_LABELS;
  const uploadError = fileError ?? errors.files;

  return (
    <div className="vp-form-grid">
      <FormField label={labels.additional_notes} htmlFor="additional_notes" fullWidth>
        <FormTextarea
          id="additional_notes"
          name="additional_notes"
          value={values.additional_notes}
          onChange={(v) => onChange('additional_notes', v)}
          disabled={disabled}
        />
      </FormField>

      <div className="vp-form-field vp-form-file-field">
        <label className="vp-form-label" id="briefing_materials_upload_label" htmlFor="briefing_materials_upload">
          Briefing materials upload
        </label>

        <input
          ref={fileInputRef}
          id="briefing_materials_upload"
          name="briefing_materials_upload"
          type="file"
          className="sr-only"
          multiple
          accept={ACCEPTED_FILE_TYPES}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              onAddFiles(e.target.files);
              e.target.value = '';
            }
          }}
          aria-labelledby="briefing_materials_upload_label"
        />

        <button
          type="button"
          className="vp-form-attach-btn"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          Attach files
        </button>

        <p className="vp-form-helper">
          Accepted: {CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS.join(', ')}. Max 10 files.
        </p>

        {(uploadError || hasError('files')) && (
          <p className="vp-form-error-msg">{uploadError}</p>
        )}

        {files.length > 0 && (
          <ul className="vp-form-file-list">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="vp-form-file-item">
                <span>{file.name}</span>
                <button
                  type="button"
                  className="vp-form-file-remove"
                  disabled={disabled}
                  onClick={() => onRemoveFile(index)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
