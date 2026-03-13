<?php
/**
 * Yoast schema: VideoObject for portfolio singles
 *
 * Adds a VideoObject (or CreativeWork) graph piece on single portfolio pages so that
 * Yoast's existing WebPage can reference it via mainEntity. Does not output
 * Organization, WebSite, or WebPage — Yoast remains the source of truth for those.
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Add VideoObject (and optionally link from WebPage mainEntity) on portfolio singles.
 *
 * @param array $graph   Yoast schema graph (array of graph pieces).
 * @param object $context Yoast Meta_Tags_Context (has indexable, canonical, etc.).
 * @return array Modified graph.
 */
function vp_yoast_schema_portfolio_video_object( $graph, $context ) {
	if ( ! is_singular( 'portfolio' ) ) {
		return $graph;
	}

	$post_id = get_queried_object_id();
	$post    = get_post( $post_id );
	if ( ! $post || $post->post_type !== 'portfolio' ) {
		return $graph;
	}

	$video_id = '#/videoobject/portfolio-' . $post_id;
	$canonical = $context->canonical;
	$name = get_the_title( $post_id );
	$desc = '';
	if ( function_exists( 'vp_portfolio_get' ) ) {
		$desc = trim( (string) vp_portfolio_get( 'description', $post_id ) );
	}
	if ( $desc === '' ) {
		$desc = wp_trim_words( $post->post_content, 30 );
	}
	$desc = wp_strip_all_tags( $desc );
	if ( $desc === '' ) {
		$desc = $name;
	}

	$thumbnail_id = get_post_thumbnail_id( $post_id );
	$image_url    = $thumbnail_id ? wp_get_attachment_image_url( $thumbnail_id, 'full' ) : '';
	$upload_date  = get_the_date( 'c', $post_id );

	$vimeo_url = '';
	if ( function_exists( 'vp_portfolio_get' ) ) {
		$vimeo_url = trim( (string) vp_portfolio_get( 'vimeo_link', $post_id ) );
	}
	// Normalize Vimeo to embed URL for embedUrl if we have a video ID.
	$embed_url = '';
	if ( $vimeo_url !== '' && preg_match( '#vimeo\.com/(?:video/)?(\d+)#', $vimeo_url, $m ) ) {
		$embed_url = 'https://player.vimeo.com/video/' . (int) $m[1];
	}

	$video = array(
		'@type'        => 'VideoObject',
		'@id'          => $video_id,
		'name'         => $name,
		'description'  => $desc,
		'url'          => $canonical,
		'uploadDate'   => $upload_date,
		'thumbnailUrl' => $image_url ?: null,
	);
	if ( $embed_url !== '' ) {
		$video['embedUrl'] = $embed_url;
	}
	$video = array_filter( $video );

	$graph[] = $video;

	// Link WebPage mainEntity to this VideoObject so the page is clearly "about" the video.
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
		if ( array_intersect( $webpage_types, $types ) ) {
			$graph[ $key ]['mainEntity'] = array( '@id' => $video_id );
			break;
		}
	}

	return $graph;
}

add_filter( 'wpseo_schema_graph', 'vp_yoast_schema_portfolio_video_object', 11, 2 );
