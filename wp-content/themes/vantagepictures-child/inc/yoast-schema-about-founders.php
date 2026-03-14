<?php
/**
 * Yoast schema: Founder Person nodes on About page
 *
 * On the About page only, adds Person schema for the four company founders and
 * links them to the existing Organization via founder + worksFor so rich data
 * formalizes the connection (bios, sameAs, jobTitle, image).
 *
 * Data source: ACF repeater "vp_founders" on the About page (see ACF setup guide
 * in this directory). If the repeater is empty or ACF is inactive, built-in
 * defaults are used.
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Default founder definitions (name, jobTitle, image_id). Used when ACF repeater is empty.
 */
function vp_about_founders_defaults() {
	return array(
		array(
			'slug'      => 'alexis-odiowei',
			'name'      => 'Alexis Odiowei',
			'jobTitle'  => 'Managing Director',
			'image_id'  => 2851,
		),
		array(
			'slug'      => 'paul-moore',
			'name'      => 'Paul Moore',
			'jobTitle'  => 'Creative Director',
			'image_id'  => 2856,
		),
		array(
			'slug'      => 'zacharia-lorenz',
			'name'      => 'Zacharia Lorenz',
			'jobTitle'  => 'Marketing Director',
			'image_id'  => 2860,
		),
		array(
			'slug'      => 'james-duong',
			'name'      => 'James Duong',
			'jobTitle'  => 'Executive Producer',
			'image_id'  => 2853,
		),
	);
}

/**
 * Founder definitions: from ACF repeater on About page if present, else defaults.
 * Each item: name, jobTitle, image_id, optional description, optional sameAs (array of URLs).
 */
function vp_about_founders_config() {
	$about_id = get_queried_object_id();
	if ( ! $about_id || ! function_exists( 'get_field' ) ) {
		$founders = vp_about_founders_defaults();
		return apply_filters( 'vp_about_founders_config', $founders );
	}

	$repeater = get_field( 'vp_founders', $about_id );
	if ( ! is_array( $repeater ) || empty( $repeater ) ) {
		$founders = vp_about_founders_defaults();
		return apply_filters( 'vp_about_founders_config', $founders );
	}

	$founders = array();
	foreach ( $repeater as $row ) {
		$name = isset( $row['name'] ) ? trim( (string) $row['name'] ) : '';
		if ( $name === '' ) {
			continue;
		}
		$item = array(
			'name'       => $name,
			'jobTitle'   => isset( $row['job_title'] ) ? trim( (string) $row['job_title'] ) : '',
			'image_id'   => ! empty( $row['image'] ) ? (int) $row['image'] : 0,
			'description' => isset( $row['bio'] ) ? trim( (string) $row['bio'] ) : '',
		);
		if ( ! empty( $row['same_as'] ) && is_array( $row['same_as'] ) ) {
			$urls = array();
			foreach ( $row['same_as'] as $link ) {
				$url = isset( $link['url'] ) ? esc_url_raw( trim( (string) $link['url'] ) ) : '';
				if ( $url !== '' ) {
					$urls[] = $url;
				}
			}
			if ( ! empty( $urls ) ) {
				$item['sameAs'] = $urls;
			}
		}
		$founders[] = $item;
	}

	if ( empty( $founders ) ) {
		$founders = vp_about_founders_defaults();
	}

	return apply_filters( 'vp_about_founders_config', $founders );
}

/**
 * Add Person schema for founders and link Organization.founder on About page.
 *
 * @param array  $graph   Yoast schema graph.
 * @param object $context Yoast Meta_Tags_Context.
 * @return array Modified graph.
 */
function vp_yoast_schema_about_founders( $graph, $context ) {
	if ( ! is_page( 'about' ) ) {
		return $graph;
	}

	$founders   = vp_about_founders_config();
	$org_id     = $context->site_url . '#organization';
	$page_url   = $context->canonical;
	$founder_ids = array();

	foreach ( $founders as $f ) {
		$slug = isset( $f['slug'] ) ? sanitize_title( $f['slug'] ) : sanitize_title( $f['name'] );
		$person_id = $page_url . '#/schema/person/' . $slug;

		$image_url = '';
		if ( ! empty( $f['image_id'] ) ) {
			$image_url = wp_get_attachment_image_url( (int) $f['image_id'], 'full' );
		}
		$image_url = $image_url ?: '';

		$person = array(
			'@type'     => 'Person',
			'@id'       => $person_id,
			'name'      => isset( $f['name'] ) ? $f['name'] : '',
			'jobTitle'  => isset( $f['jobTitle'] ) ? $f['jobTitle'] : '',
			'worksFor'  => array( '@id' => $org_id ),
		);

		if ( $image_url !== '' ) {
			$person['image'] = array(
				'@type' => 'ImageObject',
				'url'   => $image_url,
			);
		}

		if ( ! empty( $f['sameAs'] ) && is_array( $f['sameAs'] ) ) {
			$person['sameAs'] = array_values( array_filter( array_map( 'esc_url_raw', $f['sameAs'] ) ) );
		}

		if ( ! empty( $f['description'] ) && is_string( $f['description'] ) ) {
			$person['description'] = wp_strip_all_tags( $f['description'] );
		}

		$person = array_filter( $person );
		if ( ! empty( $person['name'] ) ) {
			$graph[]       = $person;
			$founder_ids[] = array( '@id' => $person_id );
		}
	}

	if ( empty( $founder_ids ) ) {
		return $graph;
	}

	// Add founder references to the existing Organization node.
	foreach ( $graph as $key => $piece ) {
		if ( ! is_array( $piece ) || empty( $piece['@type'] ) ) {
			continue;
		}
		$types = is_array( $piece['@type'] ) ? $piece['@type'] : array( $piece['@type'] );
		if ( ! in_array( 'Organization', $types, true ) ) {
			continue;
		}
		if ( isset( $piece['@id'] ) && $piece['@id'] === $org_id ) {
			$graph[ $key ]['founder'] = $founder_ids;
			break;
		}
	}

	return $graph;
}

add_filter( 'wpseo_schema_graph', 'vp_yoast_schema_about_founders', 11, 2 );
