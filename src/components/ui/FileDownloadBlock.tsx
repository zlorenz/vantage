/**
 * FileDownloadBlock — PDF filename link + download button.
 *
 * Server component. Matches live site wp-block-file styling.
 */

interface FileDownloadBlockProps {
  label: string;
  url: string;
}

export function FileDownloadBlock({ label, url }: FileDownloadBlockProps) {
  const buttonClass =
    'inline-block bg-vp-btn-primary-bg px-8 py-3 text-sm font-semibold uppercase tracking-vp-btn text-vp-btn-primary-text no-underline transition-colors duration-vp-default hover:bg-vp-btn-primary-hover-bg';

  return (
    <div className="vp-file-block flex flex-col items-start gap-5 pt-5 md:flex-row md:items-center md:gap-[var(--spacing-vp-file-block-button-gap)]">
      <h3 className="vp-file-block__label m-0 text-[clamp(1.5rem,2vw,1.75rem)] font-bold uppercase">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-vp-link no-underline hover:text-vp-link-hover"
        >
          {label}
        </a>
      </h3>
      <a href={url} download className={buttonClass}>
        DOWNLOAD
      </a>
    </div>
  );
}
