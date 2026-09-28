'use client';

/**
 * Step 3 — Final Notes: additional notes and drag-and-drop briefing materials upload.
 */

import { useCallback, useRef, useState } from 'react';
import { CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS } from '@/lib/campaign-brief-fields';
import type { CampaignBriefFieldKey } from '@/lib/campaign-brief-fields';
import type { CampaignBriefUi } from '@/lib/campaign-brief-i18n';
import { BriefUploadIcon } from '@/components/forms/brief-icons';
import { FormField, FormTextarea } from '@/components/forms/primitives';
import type {
  CampaignBriefFieldErrors,
  CampaignBriefFormValues,
} from '@/components/forms/useCampaignBriefForm';

export interface StepFinalNotesProps {
  ui: CampaignBriefUi;
  values: Pick<CampaignBriefFormValues, 'additional_notes'>;
  onChange: (key: CampaignBriefFieldKey, value: string) => void;
  files: File[];
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
  fileError: string | null;
  hasError: (key: CampaignBriefFieldKey | 'files') => boolean;
  errors: CampaignBriefFieldErrors;
  disabled: boolean;
}

const ACCEPTED_FILE_TYPES = CAMPAIGN_BRIEF_ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

export function StepFinalNotes({
  ui,
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
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);
  const labels = ui.fieldLabels;
  const uploadError = fileError ?? errors.files;

  const handleFiles = useCallback(
    (list: FileList | File[] | null) => {
      if (!list || (Array.isArray(list) ? list.length === 0 : list.length === 0)) return;
      onAddFiles(list);
    },
    [onAddFiles],
  );

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragging(false);
    if (disabled) return;
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="vp-form-grid">
      <FormField
        label={labels.additional_notes}
        htmlFor="additional_notes"
        hint={ui.hints.additional_notes}
        fullWidth
      >
        <FormTextarea
          id="additional_notes"
          name="additional_notes"
          value={values.additional_notes}
          onChange={(v) => onChange('additional_notes', v)}
          disabled={disabled}
        />
      </FormField>

      <div className="vp-form-field vp-form-file-field">
        <label
          className="vp-form-label"
          id="briefing_materials_upload_label"
          htmlFor="briefing_materials_upload"
        >
          {ui.briefingMaterials}
        </label>
        {ui.acceptedFilesHelp && (
          <p className="vp-field-hint vp-field-hint--before">{ui.acceptedFilesHelp}</p>
        )}

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
              handleFiles(e.target.files);
              e.target.value = '';
            }
          }}
          aria-labelledby="briefing_materials_upload_label"
        />

        <div
          className={`vp-form-dropzone${isDragging ? ' vp-form-dropzone--active' : ''}${disabled ? ' vp-form-dropzone--disabled' : ''}`}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <BriefUploadIcon />
          <p className="vp-form-dropzone-title">{ui.dropzonePrompt}</p>
          <p className="vp-form-dropzone-or">{ui.dropzoneOr}</p>
          <button
            type="button"
            className="vp-form-attach-btn"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            {ui.attachFiles}
          </button>
        </div>

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
                  {ui.removeFile}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
