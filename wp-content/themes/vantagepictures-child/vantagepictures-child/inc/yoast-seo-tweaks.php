<?php
/**
 * Yoast SEO tweaks: single source of truth for meta and OG
 *
 * 1. Removes duplicate Open Graph / Twitter / canonical output from UIXPress
 *    when Yoast SEO is active, so only Yoast outputs these tags.
 * 2. Sets og:type to "video.other" on portfolio singles (appropriate for
 *    a commercial video portfolio piece; Schema/OG expect this for video-centric pages).
 * 3. Inserts "Work" breadcrumb on portfolio taxonomy archives (video-format, industry, market)
 *    so the trail is Home → Work → [Term] (e.g. Home → Work → Brand Film).
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Remove UIXPress PostEditorSEO meta tags from wp_head when Yoast is active.
 * Prevents duplicate canonical, og:*, and twitter:* tags (Yoast outputs after its comment).
 *
 * Runs on init (not plugins_loaded) because the theme loads after plugins_loaded;
 * by init, both plugin and theme are loaded and the removal takes effect before wp_head.
 */
function vp_remove_uixpress_seo_duplicate() {
	if ( ! defined( 'WPSEO_VERSION' ) ) {
		return;
	}
	$class = 'UiXpress\Rest\PostEditorSEO';
	if ( ! class_exists( $class ) ) {
		return;
	}
	remove_action( 'wp_head', [ $class, 'output_seo_meta_tags' ], 1 );
}
add_action( 'init', 'vp_remove_uixpress_seo_duplicate', 0 );

/**
 * Use video.other for portfolio singles (Open Graph type for video-centric pages).
 *
 * @param string $type         Current og:type (e.g. "article").
 * @param object $presentation Yoast Indexable_Presentation.
 * @return string
 */
function vp_yoast_og_type_portfolio( $type, $presentation ) {
	if ( ! is_singular( 'portfolio' ) ) {
		return $type;
	}
	return 'video.other';
}
add_filter( 'wpseo_opengraph_type', 'vp_yoast_og_type_portfolio', 10, 2 );

/**
 * Insert "Work" page into breadcrumbs on portfolio taxonomy archives.
 * Result: Home → Work → [Term] (e.g. Home → Work → Brand Film, Tech, China).
 * Affects both the visible breadcrumb trail and the BreadcrumbList schema.
 *
 * @param array $crumbs Breadcrumb links (each: url, text, and optional id/taxonomy/term_id).
 * @return array Modified crumbs.
 */
function vp_yoast_breadcrumb_add_work_on_portfolio_tax( $crumbs ) {
	$taxonomies = array( 'video-format', 'industry', 'market' );
	if ( ! is_tax( $taxonomies ) ) {
		return $crumbs;
	}

	$work_page = get_page_by_path( 'work' );
	if ( ! $work_page || $work_page->post_status !== 'publish' ) {
		return $crumbs;
	}

	$work_url = get_permalink( $work_page );
	$work_text = _x( 'Work', 'breadcrumb', 'vantagepictures' );
	if ( $work_url === '' || $work_text === '' ) {
		return $crumbs;
	}

	$work_crumb = array(
		'url'  => $work_url,
		'text' => $work_text,
	);

	// Insert Work after Home (index 0), before the term crumb(s).
	$head = array_slice( $crumbs, 0, 1 );
	$tail = array_slice( $crumbs, 1 );
	$crumbs = array_merge( $head, array( $work_crumb ), $tail );

	return $crumbs;
}
add_filter( 'wpseo_breadcrumb_links', 'vp_yoast_breadcrumb_add_work_on_portfolio_tax', 10, 1 );
