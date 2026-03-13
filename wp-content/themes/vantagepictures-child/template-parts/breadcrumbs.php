<?php
/**
 * Template part: Yoast SEO breadcrumbs
 *
 * Outputs Yoast's breadcrumb trail when enabled in Yoast settings.
 * Uses Yoast's BreadcrumbList schema (output by Yoast in head); this is the visible trail.
 * Only renders when yoast_breadcrumb() returns non-empty output.
 *
 * @package vantagepictures-child
 */

if ( ! function_exists( 'yoast_breadcrumb' ) ) {
	return;
}

$breadcrumb = yoast_breadcrumb( '', '', false );
if ( empty( trim( (string) $breadcrumb ) ) ) {
	return;
}
?>
<nav class="vp-breadcrumb-wrapper py-2" aria-label="<?php esc_attr_e( 'Breadcrumb', 'vantagepictures' ); ?>">
	<div class="container">
		<div class="vp-breadcrumb mb-0 small text-body-secondary">
			<?php echo $breadcrumb; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped — Yoast returns escaped HTML. ?>
		</div>
	</div>
</nav>
