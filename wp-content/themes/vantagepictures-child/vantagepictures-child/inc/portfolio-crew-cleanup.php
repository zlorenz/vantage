<?php
/**
 * One-time admin utility: normalize known name variants in portfolio ACF crew fields.
 * Remove this require from functions.php after the live run completes.
 *
 * Troubleshooting: If debug.log shows nothing from this script, check option
 * `vp_portfolio_crew_cleanup_v1` — values `dry_done` or `done` mean the job
 * already finished (delete the option + `vp_portfolio_crew_cleanup_offset` to re-run).
 * Per-field lines appear only when a value would change; each batch still logs
 * "Batch starting" while work remains.
 *
 * Behavior: A field is modified only if at least one split segment’s text (after
 * wp_strip_all_tags + trim) exactly matches a key in the mapping. Unmapped
 * segments keep their original HTML/markup. Fields with no map match are left
 * untouched (no global link stripping).
 *
 * Live updates call vp_portfolio_crew_sync_post() once per affected post so crew
 * taxonomies match ACF (programmatic update_field does not fire acf/save_post).
 *
 * If cleanup ran live before that existed, re-run crew backfill: delete options
 * vp_portfolio_crew_backfill_v1 and vp_portfolio_crew_backfill_offset, then load
 * wp-admin until the backfill completes.
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// -----------------------------------------------------------------------------
// DRY RUN — set to false to run live (update_field + mark option complete).
// -----------------------------------------------------------------------------
$GLOBALS['vp_portfolio_crew_cleanup_dry_run'] = false;

/**
 * Exact-match replacements only (extend this array as needed).
 * Matching uses strip_tags + trim on each split segment only; a field is updated
 * only when at least one segment matches a key here.
 */
$GLOBALS['vp_portfolio_crew_name_map'] = array(
	'Fosha Zhong'        => 'Fosha Zyong',
	'Paul Boyer Moore'   => 'Paul Moore',
	'Magdalene Bitter-Suermann'   => 'Maggie Bitter-Suermann',
	'Huawei/HONOR'   => 'Huawei',
	'Thai-Anh "Tút" Duong'   => 'Thai Anh Duong',
	'Mate Toth Widamon'   => 'Tóth Widamon Máté',
);

const VP_PORTFOLIO_CREW_CLEANUP_OPTION    = 'vp_portfolio_crew_cleanup_v1';
const VP_PORTFOLIO_CREW_CLEANUP_OFFSET    = 'vp_portfolio_crew_cleanup_offset';
const VP_PORTFOLIO_CREW_CLEANUP_BATCH_SIZE  = 40;

/**
 * Rebuild a field only when at least one segment matches the map; otherwise leave raw unchanged.
 *
 * @param string               $original_raw Value from get_field() before any change.
 * @param array<string,string> $map            Exact-match map (keys match strip_tags+trim of segment).
 * @return array{changed:bool,value:string}
 */
function vp_portfolio_crew_cleanup_maybe_rebuild( $original_raw, array $map ) {
	if ( $original_raw === null || $original_raw === '' ) {
		return array(
			'changed' => false,
			'value'   => $original_raw,
		);
	}

	$original_raw = is_string( $original_raw ) ? $original_raw : (string) $original_raw;
	if ( trim( $original_raw ) === '' ) {
		return array(
			'changed' => false,
			'value'   => $original_raw,
		);
	}

	if ( empty( $map ) ) {
		return array(
			'changed' => false,
			'value'   => $original_raw,
		);
	}

	$s     = str_replace( array( "\r\n", "\r" ), "\n", $original_raw );
	$s     = str_replace( "\n", ',', $s );
	$parts = preg_split( '/[|,]/', $s );

	$segments = array();
	foreach ( $parts as $p ) {
		$seg = trim( $p );
		if ( $seg === '' ) {
			continue;
		}
		$segments[] = $seg;
	}

	if ( empty( $segments ) ) {
		return array(
			'changed' => false,
			'value'   => $original_raw,
		);
	}

	$had_map_match = false;
	foreach ( $segments as $seg ) {
		$stripped = trim( wp_strip_all_tags( $seg ) );
		if ( $stripped !== '' && isset( $map[ $stripped ] ) ) {
			$had_map_match = true;
			break;
		}
	}

	if ( ! $had_map_match ) {
		return array(
			'changed' => false,
			'value'   => $original_raw,
		);
	}

	$out = array();
	foreach ( $segments as $seg ) {
		$stripped = trim( wp_strip_all_tags( $seg ) );
		if ( $stripped !== '' && isset( $map[ $stripped ] ) ) {
			$out[] = $map[ $stripped ];
		} else {
			$out[] = $seg;
		}
	}

	$out = array_values( array_unique( $out, SORT_STRING ) );
	$new = implode( ', ', $out );

	if ( $new === $original_raw ) {
		return array(
			'changed' => false,
			'value'   => $original_raw,
		);
	}

	return array(
		'changed' => true,
		'value'   => $new,
	);
}

/**
 * @param int    $post_id Post ID.
 * @param string $title   Post title for logging.
 * @param string $field   ACF field name.
 * @param string $before  Original raw from get_field().
 * @param string $after   Rebuilt string.
 * @param string $mode    'DRY RUN' or 'UPDATED'.
 */
function vp_portfolio_crew_cleanup_log_change( $post_id, $title, $field, $before, $after, $mode ) {
	$msg = sprintf(
		'[VP Portfolio Crew Cleanup] %s | Post ID %d | %s | Field %s | Before: %s | After: %s',
		$mode,
		(int) $post_id,
		$title,
		$field,
		wp_json_encode( $before, JSON_UNESCAPED_UNICODE ),
		wp_json_encode( $after, JSON_UNESCAPED_UNICODE )
	);
	error_log( $msg );
}

add_action(
	'admin_init',
	function () {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$status = get_option( VP_PORTFOLIO_CREW_CLEANUP_OPTION );
		if ( $status === 'done' || $status === 'dry_done' ) {
			return;
		}

		if ( ! function_exists( 'get_field' ) || ! function_exists( 'update_field' ) ) {
			error_log( '[VP Portfolio Crew Cleanup] Skipped: ACF get_field/update_field not available (plugin inactive or wrong load order?).' );
			return;
		}

		$dry = ! empty( $GLOBALS['vp_portfolio_crew_cleanup_dry_run'] );
		$map = isset( $GLOBALS['vp_portfolio_crew_name_map'] ) && is_array( $GLOBALS['vp_portfolio_crew_name_map'] )
			? $GLOBALS['vp_portfolio_crew_name_map']
			: array();

		$fields = array(
			'prod_brand',
			'prod_director',
			'cam_dop',
			'art_art_director',
		);

		$offset = (int) get_option( VP_PORTFOLIO_CREW_CLEANUP_OFFSET, 0 );

		$post_ids = get_posts(
			array(
				'post_type'      => 'portfolio',
				'post_status'    => 'any',
				'posts_per_page' => VP_PORTFOLIO_CREW_CLEANUP_BATCH_SIZE,
				'offset'         => $offset,
				'orderby'        => 'ID',
				'order'          => 'ASC',
				'fields'         => 'ids',
				'no_found_rows'  => true,
			)
		);

		if ( empty( $post_ids ) ) {
			update_option( VP_PORTFOLIO_CREW_CLEANUP_OPTION, $dry ? 'dry_done' : 'done' );
			delete_option( VP_PORTFOLIO_CREW_CLEANUP_OFFSET );
			error_log( '[VP Portfolio Crew Cleanup] Finished (no more posts at offset ' . $offset . '). Status: ' . ( $dry ? 'dry_done' : 'done' ) );
			return;
		}

		error_log(
			sprintf(
				'[VP Portfolio Crew Cleanup] Batch starting: offset=%d, posts_in_batch=%d, dry_run=%s',
				$offset,
				count( $post_ids ),
				$dry ? 'yes' : 'no'
			)
		);

		foreach ( $post_ids as $post_id ) {
			$post_id = (int) $post_id;
			$title   = get_the_title( $post_id );

			$live_updated_this_post = false;

			foreach ( $fields as $field_name ) {
				$raw = get_field( $field_name, $post_id, false );
				if ( $raw === null || $raw === '' ) {
					continue;
				}
				if ( is_array( $raw ) ) {
					continue;
				}

				$original_raw = is_string( $raw ) ? $raw : (string) $raw;
				if ( trim( $original_raw ) === '' ) {
					continue;
				}

				$result = vp_portfolio_crew_cleanup_maybe_rebuild( $original_raw, $map );

				if ( ! $result['changed'] ) {
					continue;
				}

				$cleaned = $result['value'];

				if ( $dry ) {
					vp_portfolio_crew_cleanup_log_change( $post_id, $title, $field_name, $original_raw, $cleaned, 'DRY RUN' );
				} else {
					update_field( $field_name, $cleaned, $post_id );
					vp_portfolio_crew_cleanup_log_change( $post_id, $title, $field_name, $original_raw, $cleaned, 'UPDATED' );
					$live_updated_this_post = true;
				}
			}

			// update_field() does not fire acf/save_post; re-sync crew taxonomies from ACF so filters match DB text.
			if ( ! $dry && $live_updated_this_post && function_exists( 'vp_portfolio_crew_sync_post' ) ) {
				vp_portfolio_crew_sync_post( $post_id );
			}
		}

		$new_offset = $offset + count( $post_ids );
		update_option( VP_PORTFOLIO_CREW_CLEANUP_OFFSET, $new_offset );

		if ( count( $post_ids ) < VP_PORTFOLIO_CREW_CLEANUP_BATCH_SIZE ) {
			update_option( VP_PORTFOLIO_CREW_CLEANUP_OPTION, $dry ? 'dry_done' : 'done' );
			delete_option( VP_PORTFOLIO_CREW_CLEANUP_OFFSET );
			error_log( '[VP Portfolio Crew Cleanup] Finished. Status: ' . ( $dry ? 'dry_done' : 'done' ) );
		}
	},
	20
);
