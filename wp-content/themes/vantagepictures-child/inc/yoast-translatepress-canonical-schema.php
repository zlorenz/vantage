<?php
/**
 * Yoast + TranslatePress: align JSON-LD with the filtered canonical URL
 *
 * TranslatePress fixes the rel=canonical and og:url for translated languages via
 * wpseo_canonical / wpseo_opengraph_url. Yoast still builds schema from
 * Indexable_Presentation::$canonical before that filter, so WebPage @id/url,
 * BreadcrumbList @id, image fragment IDs, ReadAction targets, etc. could stay
 * on the default-language URL. This syncs presentation->canonical to the same
 * value used for the canonical tag so structured data matches hreflang/canonical.
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Apply wpseo_canonical to the presentation object before presenters (including Schema) run.
 *
 * @param mixed $presentation Yoast indexable presentation.
 * @param mixed $context      Yoast Meta_Tags_Context.
 * @return mixed
 */
function vp_yoast_trp_sync_presentation_canonical_for_schema( $presentation, $context ) {
	if ( ! defined( 'WPSEO_VERSION' ) || ! is_object( $presentation ) ) {
		return $presentation;
	}

	$canonical = $presentation->canonical;
	$filtered  = apply_filters( 'wpseo_canonical', $canonical, $presentation );

	if ( is_string( $filtered ) && $filtered !== '' ) {
		$presentation->canonical = $filtered;
	}

	return $presentation;
}

add_filter( 'wpseo_frontend_presentation', 'vp_yoast_trp_sync_presentation_canonical_for_schema', 10, 2 );

/**
 * Yoast WebPage piece: ensure @id matches the translated canonical URL.
 *
 * Yoast sets WebPage.@id to Meta_Tags_Context::$main_schema_id, which defaults to $context->permalink.
 * TranslatePress correctly filters $context->canonical (via wpseo_canonical) but does not change
 * $context->permalink, so @id can remain the source-language URL while url is translated.
 *
 * This only adjusts the WebPage piece and only when canonical differs from permalink.
 *
 * @param array $piece   WebPage graph piece.
 * @param object $context Yoast Meta_Tags_Context.
 * @return array
 */
function vp_yoast_trp_fix_webpage_id_to_canonical( $piece, $context ) {
	if ( ! defined( 'WPSEO_VERSION' ) || ! is_array( $piece ) || ! is_object( $context ) ) {
		return $piece;
	}

	if ( empty( $context->canonical ) || empty( $context->permalink ) ) {
		return $piece;
	}

	// Only intervene when Yoast's main schema ID (permalink) doesn't match the canonical (translated URL).
	if ( $context->canonical === $context->permalink ) {
		return $piece;
	}

	// Keep this extremely narrow: only change WebPage @id, and only if the piece already has a URL.
	if ( isset( $piece['url'] ) && is_string( $piece['url'] ) && $piece['url'] !== '' ) {
		$piece['@id'] = trailingslashit( $context->canonical );
	}

	return $piece;
}

add_filter( 'wpseo_schema_webpage', 'vp_yoast_trp_fix_webpage_id_to_canonical', 20, 2 );
