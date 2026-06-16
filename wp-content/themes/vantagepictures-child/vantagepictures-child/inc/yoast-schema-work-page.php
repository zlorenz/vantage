<?php
/**
 * Yoast schema: CollectionPage for Work (portfolio list) page
 *
 * On the Work page only, sets the WebPage node's @type to CollectionPage so
 * the portfolio listing is marked as a collection of works (commercial films).
 * CollectionPage is a Schema.org subtype of WebPage for "a collection of items
 * (e.g. a list of works)".
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Set Work page schema WebPage @type to CollectionPage.
 *
 * @param array  $graph   Yoast schema graph.
 * @param object $context Yoast Meta_Tags_Context.
 * @return array Modified graph.
 */
function vp_yoast_schema_work_collection_page( $graph, $context ) {
	if ( ! is_page( 'work' ) ) {
		return $graph;
	}

	$work_url = trailingslashit( $context->canonical );
	$webpage_types = array( 'WebPage', 'ItemPage' );
	if ( ! empty( $context->schema_page_type ) ) {
		$webpage_types = is_array( $context->schema_page_type )
			? $context->schema_page_type
			: array( $context->schema_page_type );
	}

	foreach ( $graph as $key => $piece ) {
		if ( ! is_array( $piece ) || empty( $piece['@type'] ) ) {
			continue;
		}
		$types = is_array( $piece['@type'] ) ? $piece['@type'] : array( $piece['@type'] );
		if ( ! array_intersect( $webpage_types, $types ) ) {
			continue;
		}
		if ( isset( $piece['@id'] ) && $piece['@id'] === $work_url ) {
			$graph[ $key ]['@type'] = 'CollectionPage';
			break;
		}
	}

	return $graph;
}

add_filter( 'wpseo_schema_graph', 'vp_yoast_schema_work_collection_page', 11, 2 );
