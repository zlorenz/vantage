<?php
/**
 * Google Tag Manager (GTM) installation.
 *
 * Single point of deployment for the GTM container. All other tags (GA4, Meta,
 * LinkedIn, Clarity, etc.) should be configured inside GTM, not in the theme.
 *
 * Container ID is determined by:
 * 1. Constant VP_GTM_ID (e.g. in wp-config.php) — use for environment override.
 * 2. Filter 'vp_gtm_container_id' — for programmatic override.
 * 3. Default: production container GTM-W286QXW (vantage.pictures).
 *
 * Staging: In wp-config.php on staging/localhost, add:
 *   define( 'VP_GTM_ID', 'GTM-N4HMS4WS' );
 * Production: Omit the constant or set to 'GTM-W286QXW' so the default applies.
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Returns the active GTM container ID.
 *
 * @return string GTM container ID (e.g. GTM-W286QXW).
 */
function vp_gtm_container_id() {
	$default = 'GTM-W286QXW'; // Production: vantage.pictures
	if ( defined( 'VP_GTM_ID' ) && is_string( VP_GTM_ID ) && VP_GTM_ID !== '' ) {
		$default = VP_GTM_ID;
	}
	return (string) apply_filters( 'vp_gtm_container_id', $default );
}

/**
 * Outputs the GTM script snippet in the head (as high as possible).
 */
function vp_gtm_head_snippet() {
	$id = vp_gtm_container_id();
	if ( ! preg_match( '/^GTM-[A-Z0-9]+$/', $id ) ) {
		return;
	}
	?>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','<?php echo esc_js( $id ); ?>');</script>
<!-- End Google Tag Manager -->
	<?php
}

/**
 * Outputs the GTM noscript fallback immediately after the opening body tag.
 */
function vp_gtm_body_snippet() {
	$id = vp_gtm_container_id();
	if ( ! preg_match( '/^GTM-[A-Z0-9]+$/', $id ) ) {
		return;
	}
	?>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=<?php echo esc_attr( $id ); ?>"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
	<?php
}

add_action( 'wp_head', 'vp_gtm_head_snippet', 1 );
add_action( 'wp_body_open', 'vp_gtm_body_snippet', 1 );
