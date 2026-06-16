<?php
/**
 * Sync ACF crew fields → internal crew taxonomies on save.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Map ACF field key → taxonomy slug.
 */
function vp_portfolio_crew_field_taxonomy_map() {
	return array(
		'prod_brand'       => 'client',
		'prod_director'    => 'director',
		'cam_dop'          => 'dop',
		'art_art_director' => 'art-director',
	);
}

/**
 * Strip HTML, split on comma, pipe, or line breaks; trim, dedupe.
 *
 * @param string $raw Raw string from ACF.
 * @return string[]   Non-empty normalized strings.
 */
function vp_portfolio_crew_normalize_field_value( $raw ) {
	$s = wp_strip_all_tags( (string) $raw );
	$s = str_replace( array( "\r\n", "\r" ), "\n", $s );
	$s = str_replace( "\n", ',', $s );
	$parts = preg_split( '/[|,]/', $s );
	$out   = array();
	foreach ( $parts as $p ) {
		$t = trim( $p );
		if ( $t !== '' ) {
			$out[] = $t;
		}
	}
	return array_values( array_unique( $out, SORT_STRING ) );
}

/**
 * Get or create a term by display name; returns term ID or 0 on failure.
 *
 * @param string $name     Display name.
 * @param string $taxonomy Taxonomy slug.
 */
function vp_portfolio_crew_get_or_create_term_id( $name, $taxonomy ) {
	$name = sanitize_text_field( $name );
	if ( $name === '' ) {
		return 0;
	}
	$slug = sanitize_title( $name );
	if ( $slug === '' ) {
		return 0;
	}
	$existing = get_term_by( 'slug', $slug, $taxonomy );
	if ( $existing && ! is_wp_error( $existing ) ) {
		return (int) $existing->term_id;
	}
	$insert = wp_insert_term(
		$name,
		$taxonomy,
		array( 'slug' => $slug )
	);
	if ( is_wp_error( $insert ) ) {
		return 0;
	}
	return (int) $insert['term_id'];
}

/**
 * Sync all crew taxonomies for one portfolio post from ACF.
 *
 * @param int $post_id Post ID.
 */
function vp_portfolio_crew_sync_post( $post_id ) {
	$post_id = (int) $post_id;
	if ( $post_id <= 0 || get_post_type( $post_id ) !== 'portfolio' ) {
		return;
	}

	$map = vp_portfolio_crew_field_taxonomy_map();

	foreach ( $map as $field_key => $taxonomy ) {
		wp_set_object_terms( $post_id, array(), $taxonomy );

		if ( ! function_exists( 'get_field' ) ) {
			continue;
		}
		$raw = get_field( $field_key, $post_id );
		$names = vp_portfolio_crew_normalize_field_value( $raw );
		if ( empty( $names ) ) {
			continue;
		}
		$term_ids = array();
		foreach ( $names as $name ) {
			$tid = vp_portfolio_crew_get_or_create_term_id( $name, $taxonomy );
			if ( $tid > 0 ) {
				$term_ids[] = $tid;
			}
		}
		$term_ids = array_values( array_unique( array_map( 'intval', $term_ids ) ) );
		if ( ! empty( $term_ids ) ) {
			wp_set_object_terms( $post_id, $term_ids, $taxonomy, false );
		}
	}
}

add_action(
	'acf/save_post',
	function ( $post_id ) {
		if ( ! is_numeric( $post_id ) ) {
			return;
		}
		$post_id = (int) $post_id;
		if ( $post_id <= 0 || get_post_type( $post_id ) !== 'portfolio' ) {
			return;
		}
		if ( wp_is_post_revision( $post_id ) ) {
			return;
		}
		vp_portfolio_crew_sync_post( $post_id );
	},
	20
);

/**
 * One-time backfill: sync all published portfolio posts (batched on admin).
 */
function vp_portfolio_crew_run_backfill_batch() {
	$offset = (int) get_option( 'vp_portfolio_crew_backfill_offset', 0 );
	$batch  = 40;

	$posts = get_posts(
		array(
			'post_type'      => 'portfolio',
			'post_status'    => 'any',
			'posts_per_page' => $batch,
			'offset'         => $offset,
			'fields'         => 'ids',
			'orderby'        => 'ID',
			'order'          => 'ASC',
			'no_found_rows'  => true,
		)
	);

	if ( empty( $posts ) ) {
		update_option( 'vp_portfolio_crew_backfill_v1', '1' );
		delete_option( 'vp_portfolio_crew_backfill_offset' );
		return false;
	}

	foreach ( $posts as $pid ) {
		vp_portfolio_crew_sync_post( (int) $pid );
	}

	update_option( 'vp_portfolio_crew_backfill_offset', $offset + count( $posts ) );
	return true;
}

add_action(
	'admin_init',
	function () {
		if ( get_option( 'vp_portfolio_crew_backfill_v1' ) === '1' ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		// Run one batch per admin request until done (avoids timeouts).
		vp_portfolio_crew_run_backfill_batch();
	}
);
