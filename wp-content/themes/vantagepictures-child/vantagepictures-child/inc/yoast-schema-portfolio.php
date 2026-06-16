<?php
/**
 * Yoast schema: VideoObject for portfolio singles
 *
 * Adds a VideoObject (or CreativeWork) graph piece on single portfolio pages so that
 * Yoast's existing WebPage can reference it via mainEntity. Does not output
 * Organization, WebSite, or WebPage — Yoast remains the source of truth for those.
 *
 * Crew credits from ACF are mapped to Schema.org properties:
 * - productionCompany / publisher → Organization (Vantage Pictures or prod_production_company)
 * - director, creator → prod_director
 * - producer → prod_executive_producer, prod_producer
 * - editor → post_editor
 * - contributor → DOP, Art Director, Gaffer, Key Grip, Colorist, Sound Design, Photographer (Person + jobTitle)
 * - musicBy → post_composer
 * - actor → cast_talent
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Parse comma-separated names into an array of trimmed, plain-text names.
 * Strips HTML so Schema.org Person name is always plain text (e.g. ACF link fields).
 *
 * @param string $names Raw value (e.g. "Name A, Name B" or "<a href=\"...\">Name</a>").
 * @return string[] List of names.
 */
function vp_schema_parse_names( $names ) {
	$names = trim( (string) $names );
	if ( $names === '' ) {
		return array();
	}
	$parts = preg_split( '/[,&]+/', $names, -1, PREG_SPLIT_NO_EMPTY );
	$out   = array();
	foreach ( $parts as $part ) {
		$part = trim( wp_strip_all_tags( $part ) );
		if ( $part !== '' ) {
			$out[] = $part;
		}
	}
	return array_values( array_unique( $out ) );
}

/**
 * Build Schema.org Person nodes from a comma-separated names string.
 *
 * @param string       $names    Raw names (e.g. "Name A, Name B").
 * @param string       $job_title Optional jobTitle for each person.
 * @param string       $page_url  Canonical URL of the portfolio page (for optional @id).
 * @param string|false  $role_slug Optional slug for @id fragment.
 * @return array[] List of Person graph pieces (with @type, name; optional jobTitle, @id).
 */
function vp_schema_persons_from_names( $names, $job_title = '', $page_url = '', $role_slug = false ) {
	$arr = vp_schema_parse_names( $names );
	if ( empty( $arr ) ) {
		return array();
	}
	$persons = array();
	foreach ( $arr as $i => $name ) {
		$name = wp_strip_all_tags( $name );
		if ( $name === '' ) {
			continue;
		}
		$person = array(
			'@type' => 'Person',
			'name'  => $name,
		);
		if ( $job_title !== '' ) {
			$person['jobTitle'] = $job_title;
		}
		if ( $page_url !== '' && $role_slug !== false ) {
			$person['@id'] = $page_url . '#/schema/person/' . $role_slug . '-' . ( $i + 1 );
		}
		$persons[] = $person;
	}
	return $persons;
}

/**
 * Get Organization @id for production company / publisher (Yoast's Organization node).
 *
 * @param object $context Yoast Meta_Tags_Context.
 * @return string Organization @id.
 */
function vp_schema_portfolio_org_id( $context ) {
	return $context->site_url . '#organization';
}

/**
 * Add VideoObject (and crew credits) and link from WebPage mainEntity on portfolio singles.
 *
 * @param array  $graph   Yoast schema graph (array of graph pieces).
 * @param object $context Yoast Meta_Tags_Context (has indexable, canonical, site_url, etc.).
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

	$video_id  = '#/videoobject/portfolio-' . $post_id;
	$canonical = $context->canonical;
	$name      = get_the_title( $post_id );
	$desc      = '';
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

	// Production company & publisher: reference Yoast's Organization (Vantage Pictures).
	$org_id = vp_schema_portfolio_org_id( $context );
	$video['productionCompany'] = array( '@id' => $org_id );
	$video['publisher']          = array( '@id' => $org_id );

	// Director (VideoObject) and creator (CreativeWork) — same person(s).
	if ( function_exists( 'vp_portfolio_get' ) ) {
		$director_raw = trim( (string) vp_portfolio_get( 'prod_director', $post_id ) );
		if ( $director_raw !== '' ) {
			$directors = vp_schema_persons_from_names( $director_raw, '', $canonical, 'director' );
			if ( ! empty( $directors ) ) {
				$video['director'] = count( $directors ) === 1 ? $directors[0] : $directors;
				$video['creator']  = count( $directors ) === 1 ? $directors[0] : $directors;
			}
		}
	}

	// Producer: Executive Producer + Producer (combined).
	if ( function_exists( 'vp_portfolio_get' ) ) {
		$ep_raw = trim( (string) vp_portfolio_get( 'prod_executive_producer', $post_id ) );
		$p_raw  = trim( (string) vp_portfolio_get( 'prod_producer', $post_id ) );
		$all_producers = vp_schema_parse_names( $ep_raw . ',' . $p_raw );
		if ( ! empty( $all_producers ) ) {
			$producers = array();
			foreach ( $all_producers as $i => $n ) {
				$n = wp_strip_all_tags( $n );
				if ( $n === '' ) {
					continue;
				}
				$producers[] = array(
					'@type' => 'Person',
					'name'  => $n,
					'@id'   => $canonical . '#/schema/person/producer-' . ( count( $producers ) + 1 ),
				);
			}
			$video['producer'] = count( $producers ) === 1 ? $producers[0] : $producers;
		}
	}

	// Editor.
	if ( function_exists( 'vp_portfolio_get' ) ) {
		$editor_raw = trim( (string) vp_portfolio_get( 'post_editor', $post_id ) );
		if ( $editor_raw !== '' ) {
			$editors = vp_schema_persons_from_names( $editor_raw, 'Editor', $canonical, 'editor' );
			if ( ! empty( $editors ) ) {
				$video['editor'] = count( $editors ) === 1 ? $editors[0] : $editors;
			}
		}
	}

	// Contributor: key crew with jobTitle (DOP, Art Director, Gaffer, Key Grip, Colorist, Sound Design, Photographer).
	$contributor_fields = array(
		'cam_dop'                 => 'Director of Photography',
		'art_art_director'        => 'Art Director',
		'art_production_designer' => 'Production Designer',
		'ge_gaffer'               => 'Gaffer',
		'ge_key_grip'             => 'Key Grip',
		'post_colorist'           => 'Colorist',
		'post_sound_design_mix'   => 'Sound Design & Mix',
		'stills_photographer'     => 'Photographer',
	);
	$contributors = array();
	if ( function_exists( 'vp_portfolio_get' ) ) {
		foreach ( $contributor_fields as $field => $job_title ) {
			$val = trim( (string) vp_portfolio_get( $field, $post_id ) );
			if ( $val === '' ) {
				continue;
			}
			$persons = vp_schema_persons_from_names( $val, $job_title, $canonical, sanitize_title( $field ) );
			$contributors = array_merge( $contributors, $persons );
		}
		if ( ! empty( $contributors ) ) {
			$video['contributor'] = $contributors;
		}
	}

	// musicBy (VideoObject) — composer.
	if ( function_exists( 'vp_portfolio_get' ) ) {
		$composer_raw = trim( (string) vp_portfolio_get( 'post_composer', $post_id ) );
		if ( $composer_raw !== '' ) {
			$composers = vp_schema_persons_from_names( $composer_raw, '', $canonical, 'composer' );
			if ( ! empty( $composers ) ) {
				$video['musicBy'] = count( $composers ) === 1 ? $composers[0] : $composers;
			}
		}
	}

	// actor — on-screen talent.
	if ( function_exists( 'vp_portfolio_get' ) ) {
		$talent_raw = trim( (string) vp_portfolio_get( 'cast_talent', $post_id ) );
		if ( $talent_raw !== '' ) {
			$actors = vp_schema_persons_from_names( $talent_raw, '', $canonical, 'actor' );
			if ( ! empty( $actors ) ) {
				$video['actor'] = count( $actors ) === 1 ? $actors[0] : $actors;
			}
		}
	}

	$video = array_filter( $video );

	$graph[] = $video;

	// Link WebPage mainEntity to this VideoObject.
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
