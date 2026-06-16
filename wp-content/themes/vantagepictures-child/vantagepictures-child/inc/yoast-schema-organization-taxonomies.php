<?php
/**
 * Yoast schema: Organization specialties and areas served from portfolio taxonomies
 *
 * Augments the existing Organization node in the schema graph with:
 * - areaServed: market taxonomy terms (China, Singapore, USA, etc.) — geographic markets
 * - knowsAbout: industry + video-format taxonomy terms (Tech, Brand Film, etc.) — expertise topics
 *
 * Schema.org: areaServed = "The geographic area where a service or offered item is provided.";
 * knowsAbout = "topic that is known about - suggesting possible expertise" (Organization).
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Decode HTML entities in a string for use in JSON-LD (so schema values use & not &amp;).
 *
 * @param string $name Term name or other text from the database.
 * @return string Decoded string.
 */
function vp_schema_decode_term_name( $name ) {
	return html_entity_decode( trim( (string) $name ), ENT_QUOTES | ENT_HTML5, 'UTF-8' );
}

/**
 * Add areaServed (markets) and knowsAbout (industries + video formats) to the Organization node.
 *
 * @param array  $graph   Yoast schema graph.
 * @param object $context Yoast Meta_Tags_Context.
 * @return array Modified graph.
 */
function vp_yoast_schema_organization_taxonomies( $graph, $context ) {
	$org_id = $context->site_url . '#organization';

	// Get all terms from portfolio taxonomies. hide_empty = false so we list all defined terms.
	$market_terms = get_terms( array(
		'taxonomy'   => 'market',
		'hide_empty' => false,
	) );
	$industry_terms = get_terms( array(
		'taxonomy'   => 'industry',
		'hide_empty' => false,
	) );
	$format_terms = get_terms( array(
		'taxonomy'   => 'video-format',
		'hide_empty' => false,
	) );

	$area_served = array();
	if ( ! is_wp_error( $market_terms ) && ! empty( $market_terms ) ) {
		foreach ( $market_terms as $term ) {
			$name = vp_schema_decode_term_name( $term->name );
			if ( $name !== '' ) {
				$area_served[] = $name;
			}
		}
	}

	$knows_about = array();
	foreach ( array( $industry_terms, $format_terms ) as $terms ) {
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			continue;
		}
		foreach ( $terms as $term ) {
			$name = vp_schema_decode_term_name( $term->name );
			if ( $name !== '' ) {
				$knows_about[] = $name;
			}
		}
	}
	$knows_about = array_values( array_unique( $knows_about ) );

	if ( empty( $area_served ) && empty( $knows_about ) ) {
		return $graph;
	}

	foreach ( $graph as $key => $piece ) {
		if ( ! is_array( $piece ) || empty( $piece['@type'] ) ) {
			continue;
		}
		$types = is_array( $piece['@type'] ) ? $piece['@type'] : array( $piece['@type'] );
		if ( ! in_array( 'Organization', $types, true ) ) {
			continue;
		}
		if ( isset( $piece['@id'] ) && $piece['@id'] === $org_id ) {
			if ( ! empty( $area_served ) ) {
				$graph[ $key ]['areaServed'] = count( $area_served ) === 1 ? $area_served[0] : $area_served;
			}
			if ( ! empty( $knows_about ) ) {
				$graph[ $key ]['knowsAbout'] = count( $knows_about ) === 1 ? $knows_about[0] : $knows_about;
			}
			break;
		}
	}

	return $graph;
}

add_filter( 'wpseo_schema_graph', 'vp_yoast_schema_organization_taxonomies', 12, 2 );
