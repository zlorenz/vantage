<?php
/**
 * Portfolio Credits Migration
 *
 * Migrates old flat credit fields to the new department-based ACF structure.
 * Run this after creating the new "Portfolio Credits" field group in ACF.
 *
 * Old fields (flat): client, agency, dop, gaffer, etc.
 * New structure: prod_brand, prod_agency, cam_dop, ge_gaffer, etc. + repeaters.
 *
 * Usage: Tools → VP Portfolio Credits Migrate
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Mapping: old meta key => new field.
 * 'field' => direct field slug
 * 'repeater' => ['repeater' => 'slug', 'role' => 'Display Label']
 */
function vp_credits_migrate_get_mapping() {
	return [
		/* Production - direct */
		'client'                   => [ 'field' => 'prod_brand' ],
		'agency'                    => [ 'field' => 'prod_agency' ],
		'production_company'        => [ 'field' => 'prod_production_company' ],
		'production_service'        => [ 'field' => 'prod_production_service' ],
		'exec_producer'             => [ 'field' => 'prod_executive_producer' ],
		'director'                  => [ 'field' => 'prod_director' ],
		'producer'                  => [ 'field' => 'prod_producer' ],
		'line_producer'             => [ 'field' => 'prod_line_producer' ],
		'production_manager'        => [ 'field' => 'prod_production_manager' ],
		'production_coordinator'    => [ 'field' => 'prod_production_coordinator' ],
		'1st_ad'                    => [ 'field' => 'prod_1st_ad' ],
		'2nd_ad'                    => [ 'field' => 'prod_2nd_ad' ],
		'production_assist'         => [ 'field' => 'prod_production_assistant' ],
		'product_tech'              => [ 'field' => 'prod_product_technician' ],
		'account_manager'           => [ 'field' => 'prod_account_manager' ],
		'drivers'                   => [ 'field' => 'prod_transport' ],
		'chaperone'                 => [ 'field' => 'prod_chaperone' ],
		'bts'                       => [ 'field' => 'prod_bts' ],
		/* Production - repeater */
		'creative_director'         => [ 'repeater' => 'prod_additional', 'role' => 'Creative Director' ],
		'agency_producer'           => [ 'repeater' => 'prod_additional', 'role' => 'Agency Producer' ],
		'dir_assist'               => [ 'repeater' => 'prod_additional', 'role' => "Director's Assistant" ],
		'hop'                       => [ 'repeater' => 'prod_additional', 'role' => 'Head of Production' ],
		'assistant_producer'        => [ 'repeater' => 'prod_additional', 'role' => 'Assistant Producer' ],
		'assistant_production_manager' => [ 'repeater' => 'prod_additional', 'role' => 'Assistant Production Manager' ],
		'translator'                => [ 'repeater' => 'prod_additional', 'role' => 'Translator' ],
		'catering'                  => [ 'repeater' => 'prod_additional', 'role' => 'Catering' ],
		'medic'                     => [ 'repeater' => 'prod_additional', 'role' => 'Medic' ],

		/* Camera - direct */
		'dop'                       => [ 'field' => 'cam_dop' ],
		'camera_op'                 => [ 'field' => 'cam_camera_op' ],
		'steadicam'                 => [ 'field' => 'cam_steadicam_op' ],
		'1st_ac'                    => [ 'field' => 'cam_1st_ac' ],
		'2nd_ac'                    => [ 'field' => 'cam_2nd_ac' ],
		'focus'                     => [ 'field' => 'cam_focus_puller' ],
		'dit'                       => [ 'field' => 'cam_dit' ],
		'drone_op'                  => [ 'field' => 'cam_drone_op' ],
		'moco'                      => [ 'field' => 'cam_motion_control' ],
		/* Camera - repeater (qtake not in old) */
		'camera_asst'               => [ 'repeater' => 'cam_additional', 'role' => 'Camera Assistants' ],
		'live-stream_tech'          => [ 'repeater' => 'cam_additional', 'role' => 'Live-Stream Technician' ],

		/* G&E - direct */
		'rental_house'              => [ 'field' => 'ge_rental_house' ],
		'gaffer'                    => [ 'field' => 'ge_gaffer' ],
		'key_grip'                  => [ 'field' => 'ge_key_grip' ],
		'grip'                      => [ 'field' => 'ge_grip' ],
		'electric'                  => [ 'field' => 'ge_electrician' ],
		/* G&E - repeater */
		'bbg'                       => [ 'repeater' => 'ge_additional', 'role' => 'Best Boy Grip' ],
		'bbe'                       => [ 'repeater' => 'ge_additional', 'role' => 'Best Boy Electric' ],
		'ge'                        => [ 'repeater' => 'ge_additional', 'role' => 'Grip & Lighting' ],

		/* Art - direct */
		'production_designer'       => [ 'field' => 'art_production_designer' ],
		'art_director'              => [ 'field' => 'art_art_director' ],
		'propsmaster'               => [ 'field' => 'art_props_master' ],
		'art_assist'                => [ 'field' => 'art_art_assistant' ],
		'wardrobe'                  => [ 'field' => 'art_wardrobe' ],
		'locations'                 => [ 'field' => 'art_location_manager' ],
		'storyboards'               => [ 'field' => 'art_storyboard_artist' ],
		/* Art - repeater (makeup + hair merge handled separately) */
		'food_stylist'              => [ 'repeater' => 'art_additional', 'role' => 'Food Stylist' ],
		'wardrobe_assistant'        => [ 'repeater' => 'art_additional', 'role' => 'Wardrobe Assistant' ],

		/* Casting - direct */
		'talent'                    => [ 'field' => 'cast_talent' ],
		'casting_director'          => [ 'field' => 'cast_casting_director' ],
		'casting'                   => [ 'field' => 'cast_casting_manager' ],
		'stunt_coordinator'         => [ 'field' => 'cast_stunt_coordinator' ],
		'dance_choreographer'      => [ 'field' => 'cast_choreographer' ],
		'animal_wrangler'           => [ 'field' => 'cast_animal_wrangler' ],
		/* Casting - repeater */
		'sfx_technician'            => [ 'repeater' => 'cast_additional', 'role' => 'SFX Technician' ],

		/* Stills - direct */
		'photographer'              => [ 'field' => 'stills_photographer' ],
		'photo_assist'              => [ 'field' => 'stills_photography_assistant' ],

		/* Post - direct */
		'post_producer'             => [ 'field' => 'post_post_supervisor' ],
		'editor'                    => [ 'field' => 'post_editor' ],
		'edit_assist'               => [ 'field' => 'post_assistant_editor' ],
		'colorist'                  => [ 'field' => 'post_colorist' ],
		'sound_design'              => [ 'field' => 'post_sound_design_mix' ],
		'music'                     => [ 'field' => 'post_composer' ],
		'3d'                        => [ 'field' => 'post_3d_animation' ],
		/* Post - repeater (vfx_sup + vfx merge handled separately) */
		'post_house'                => [ 'repeater' => 'post_additional', 'role' => 'Post House' ],
		'mgfx'                      => [ 'repeater' => 'post_additional', 'role' => 'Motion Graphic Artist' ],
		'sound_engineer'            => [ 'repeater' => 'post_additional', 'role' => 'Sound Engineer' ],
	];
}

/**
 * Get old credit value from post (meta or ACF).
 *
 * @param int    $post_id Post ID.
 * @param string $key     Old meta key.
 * @return string Trimmed value.
 */
function vp_credits_migrate_get_old_value( $post_id, $key ) {
	$val = '';
	if ( function_exists( 'get_field' ) ) {
		$val = get_field( $key, $post_id );
	}
	if ( ( $val === false || $val === null || $val === '' ) && function_exists( 'get_post_meta' ) ) {
		$val = get_post_meta( $post_id, $key, true );
	}
	return trim( (string) $val );
}

/**
 * Build migrated data for one portfolio post.
 *
 * @param int $post_id Portfolio post ID.
 * @return array ['direct' => [field=>val,...], 'repeaters' => [repeater=>[[role,names],...]], 'special' => [...]]
 */
function vp_credits_migrate_build_data( $post_id ) {
	$mapping = vp_credits_migrate_get_mapping();
	$direct  = [];
	$repeaters = [];

	foreach ( $mapping as $old_key => $rule ) {
		$val = vp_credits_migrate_get_old_value( $post_id, $old_key );
		if ( $val === '' ) {
			continue;
		}

		if ( isset( $rule['field'] ) ) {
			$direct[ $rule['field'] ] = $val;
		} elseif ( isset( $rule['repeater'] ) && isset( $rule['role'] ) ) {
			$rep = $rule['repeater'];
			if ( ! isset( $repeaters[ $rep ] ) ) {
				$repeaters[ $rep ] = [];
			}
			$repeaters[ $rep ][] = [ 'role' => $rule['role'], 'names' => $val ];
		}
	}

	/* Special: makeup + hair_stylist → art_hair_makeup */
	$makeup = vp_credits_migrate_get_old_value( $post_id, 'makeup' );
	$hair   = vp_credits_migrate_get_old_value( $post_id, 'hair_stylist' );
	if ( $makeup !== '' || $hair !== '' ) {
		$parts = array_filter( [ $makeup, $hair ] );
		$direct['art_hair_makeup'] = implode( ', ', $parts );
	}

	/* Special: vfx_sup + vfx → post_vfx (prefer vfx_sup, merge if both) */
	$vfx_sup = vp_credits_migrate_get_old_value( $post_id, 'vfx_sup' );
	$vfx     = vp_credits_migrate_get_old_value( $post_id, 'vfx' );
	if ( $vfx_sup !== '' || $vfx !== '' ) {
		$parts = array_filter( array_unique( [ $vfx_sup, $vfx ] ) );
		$direct['post_vfx'] = implode( ', ', $parts );
	}

	/* Special: on-set editor - old doesn't have it, skip */
	/* Special: post voice_over, online - old doesn't have, skip */

	return [ 'direct' => $direct, 'repeaters' => $repeaters ];
}

/**
 * Run migration for a single portfolio post.
 *
 * @param int  $post_id Portfolio post ID.
 * @param bool $dry_run If true, do not save.
 * @return array ['success' => bool, 'migrated' => int, 'message' => string, 'preview' => array]
 */
function vp_credits_migrate_single_post( $post_id, $dry_run = false ) {
	$post = get_post( $post_id );
	if ( ! $post || $post->post_type !== 'portfolio' ) {
		return [ 'success' => false, 'migrated' => 0, 'message' => 'Invalid post.', 'preview' => [] ];
	}

	$data = vp_credits_migrate_build_data( $post_id );
	$total = count( $data['direct'] );
	foreach ( $data['repeaters'] as $rows ) {
		$total += count( $rows );
	}

	if ( $total === 0 ) {
		return [ 'success' => true, 'migrated' => 0, 'message' => 'No old credits to migrate.', 'preview' => [] ];
	}

	if ( $dry_run ) {
		return [
			'success'  => true,
			'migrated' => $total,
			'message'  => sprintf( 'Would migrate %d credit(s).', $total ),
			'preview'  => $data,
		];
	}

	if ( ! function_exists( 'update_field' ) ) {
		return [ 'success' => false, 'migrated' => 0, 'message' => 'ACF update_field not available.', 'preview' => [] ];
	}

	$saved = 0;

	/* Save direct fields */
	foreach ( $data['direct'] as $field => $val ) {
		if ( update_field( $field, $val, $post_id ) !== false ) {
			$saved++;
		}
	}

	/* Append repeater rows (merge with existing to avoid overwriting) */
	foreach ( $data['repeaters'] as $repeater_key => $new_rows ) {
		$existing = get_field( $repeater_key, $post_id );
		if ( ! is_array( $existing ) ) {
			$existing = [];
		}
		foreach ( $new_rows as $row ) {
			$existing[] = [
				'role'  => $row['role'],
				'names' => $row['names'],
			];
			$saved++;
		}
		update_field( $repeater_key, $existing, $post_id );
	}

	return [
		'success'  => true,
		'migrated' => $saved,
		'message'  => sprintf( 'Migrated %d credit(s).', $saved ),
		'preview'  => $data,
	];
}

/**
 * Get all portfolio posts (for migration listing).
 *
 * @return WP_Post[]
 */
function vp_credits_migrate_get_portfolio_posts() {
	$q = new WP_Query( [
		'post_type'      => 'portfolio',
		'post_status'    => [ 'publish', 'draft', 'pending' ],
		'posts_per_page' => -1,
		'orderby'        => 'date',
		'order'          => 'DESC',
	] );
	return $q->have_posts() ? $q->posts : [];
}

/**
 * Check if any portfolio has old credit data worth migrating.
 *
 * @return bool
 */
function vp_credits_migrate_has_old_data() {
	$mapping = vp_credits_migrate_get_mapping();
	$keys    = array_keys( $mapping );
	$keys[]  = 'makeup';
	$keys[]  = 'hair_stylist';
	$keys[]  = 'vfx_sup';
	$keys[]  = 'vfx';

	global $wpdb;
	$placeholders = implode( ',', array_fill( 0, count( $keys ), '%s' ) );
	$query = $wpdb->prepare(
		"SELECT COUNT(DISTINCT p.ID) FROM {$wpdb->posts} p
		INNER JOIN {$wpdb->postmeta} m ON p.ID = m.post_id
		WHERE p.post_type = 'portfolio' AND p.post_status IN ('publish','draft','pending')
		AND m.meta_key IN ($placeholders) AND m.meta_value != ''",
		$keys
	);
	$count = (int) $wpdb->get_var( $query );
	return $count > 0;
}

/**
 * Register admin menu.
 */
add_action( 'admin_menu', function () {
	add_management_page(
		'VP Portfolio Credits Migrate',
		'VP Portfolio Credits Migrate',
		'edit_posts',
		'vp-portfolio-credits-migrate',
		'vp_credits_migrate_render_admin_page'
	);
}, 12 );

/**
 * AJAX: Preview migration for a single post.
 */
add_action( 'wp_ajax_vp_credits_migrate_preview', function () {
	check_ajax_referer( 'vp_credits_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
	if ( ! $post_id ) {
		wp_send_json_error( [ 'message' => 'Invalid post ID' ] );
	}
	$result = vp_credits_migrate_single_post( $post_id, true );
	wp_send_json_success( $result );
} );

/**
 * AJAX: Migrate a single post.
 */
add_action( 'wp_ajax_vp_credits_migrate_one', function () {
	check_ajax_referer( 'vp_credits_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
	if ( ! $post_id ) {
		wp_send_json_error( [ 'message' => 'Invalid post ID' ] );
	}
	$result = vp_credits_migrate_single_post( $post_id, false );
	wp_send_json_success( $result );
} );

/**
 * AJAX: Migrate all portfolio posts.
 */
add_action( 'wp_ajax_vp_credits_migrate_all', function () {
	check_ajax_referer( 'vp_credits_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$posts = vp_credits_migrate_get_portfolio_posts();
	$done  = 0;
	$total_credits = 0;
	$errors = [];
	foreach ( $posts as $post ) {
		$result = vp_credits_migrate_single_post( $post->ID, false );
		if ( $result['success'] ) {
			$done++;
			$total_credits += $result['migrated'];
		} else {
			$errors[] = $post->post_title . ': ' . $result['message'];
		}
	}
	wp_send_json_success( [
		'done'          => $done,
		'total'         => count( $posts ),
		'total_credits' => $total_credits,
		'errors'        => $errors,
	] );
} );

/**
 * Render the admin migration page.
 */
function vp_credits_migrate_render_admin_page() {
	$posts    = vp_credits_migrate_get_portfolio_posts();
	$has_old  = vp_credits_migrate_has_old_data();
	$nonce    = wp_create_nonce( 'vp_credits_migrate' );
	?>
	<div class="wrap">
		<h1>VP Portfolio Credits Migration</h1>
		<p>Migrates old flat credit fields to the new department-based ACF structure (<code>prod_*</code>, <code>cam_*</code>, <code>ge_*</code>, etc.).</p>

		<div class="notice notice-info" style="margin: 1rem 0;">
			<p><strong>Before running:</strong></p>
			<ul style="list-style: disc; margin-left: 1.5rem;">
				<li>Create the new "Portfolio Credits" ACF field group assigned to the <code>portfolio</code> post type.</li>
				<li>Ensure all new field slugs exist (prod_brand, prod_agency, cam_dop, prod_additional, etc.).</li>
				<li>This migration copies data only; it does not remove old fields.</li>
			</ul>
		</div>

		<p><strong>Mapping summary:</strong> Client→Brand, Agency→prod_agency, Production Company→prod_production_company, Director→prod_director, DOP→cam_dop, Gaffer→ge_gaffer, etc. Unmapped roles (Creative Director, Catering, etc.) go into department "Additional Credits" repeaters.</p>

		<?php if ( empty( $posts ) ) : ?>
			<p><strong>No portfolio posts found.</strong></p>
			<?php return; ?>
		<?php endif; ?>

		<p><strong><?php echo esc_html( count( $posts ) ); ?> portfolio item(s)</strong> in database.
		<?php if ( $has_old ) : ?>
			<span style="color: #46b450;">Old credit data detected.</span>
		<?php else : ?>
			<span style="color: #888;">No old credit meta found – nothing to migrate.</span>
		<?php endif; ?>
		</p>

		<div class="vp-migrate-actions" style="margin: 1.5rem 0;">
			<button type="button" class="button button-primary" id="vp-credits-migrate-all" <?php echo ! $has_old ? 'disabled' : ''; ?>>Migrate all <?php echo esc_attr( count( $posts ) ); ?> posts</button>
		</div>

		<div id="vp-credits-migrate-result" style="margin-top: 1rem; display: none;"></div>

		<table class="wp-list-table widefat fixed striped">
			<thead>
				<tr>
					<th>Portfolio Item</th>
					<th>Date</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				<?php foreach ( $posts as $post ) : ?>
					<?php
					$preview = vp_credits_migrate_single_post( $post->ID, true );
					$has_data = $preview['migrated'] > 0;
					?>
					<tr data-post-id="<?php echo esc_attr( $post->ID ); ?>">
						<td>
							<strong><?php echo esc_html( $post->post_title ); ?></strong>
							<br><small><?php echo esc_html( get_permalink( $post ) ); ?></small>
							<?php if ( $has_data ) : ?>
								<br><small style="color: #46b450;"><?php echo esc_html( $preview['migrated'] ); ?> credit(s) to migrate</small>
							<?php endif; ?>
						</td>
						<td><?php echo esc_html( get_the_date( '', $post ) ); ?></td>
						<td>
							<a href="<?php echo esc_url( get_edit_post_link( $post->ID, 'raw' ) ); ?>" class="button button-small">Edit</a>
							<a href="<?php echo esc_url( get_permalink( $post ) ); ?>" class="button button-small" target="_blank">View</a>
							<button type="button" class="button button-small vp-credits-preview" data-id="<?php echo esc_attr( $post->ID ); ?>" <?php echo ! $has_data ? 'disabled' : ''; ?>>Preview</button>
							<button type="button" class="button button-small button-primary vp-credits-migrate-one" data-id="<?php echo esc_attr( $post->ID ); ?>" <?php echo ! $has_data ? 'disabled' : ''; ?>>Migrate</button>
						</td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>

	<div id="vp-credits-preview-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100000; align-items: center; justify-content: center;">
		<div style="background: #1e1e1e; color: #e8e8e8; max-width: 640px; max-height: 80vh; overflow: auto; padding: 1.5rem; border-radius: 6px; border: 1px solid #3a3a3a; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
			<h3 style="margin: 0 0 1rem; color: #fff;">Migration preview</h3>
			<div id="vp-credits-preview-content" style="border: 1px solid #3a3a3a; padding: 1rem; background: #252525; font-size: 13px; line-height: 1.6;"></div>
			<p style="margin: 1rem 0 0;">
				<button type="button" class="button" id="vp-credits-close-preview" style="background: #3a3a3a; color: #e8e8e8; border-color: #4a4a4a;">Close</button>
			</p>
		</div>
	</div>

	<script>
	(function() {
		var nonce = <?php echo json_encode( $nonce ); ?>;
		var resultEl = document.getElementById('vp-credits-migrate-result');
		var modal = document.getElementById('vp-credits-preview-modal');
		var previewContent = document.getElementById('vp-credits-preview-content');

		function showResult(msg, isError) {
			resultEl.style.display = 'block';
			resultEl.className = 'notice notice-' + (isError ? 'error' : 'success');
			resultEl.innerHTML = '<p>' + msg + '</p>';
		}

		function formatPreview(data) {
			if (!data || (!data.direct || Object.keys(data.direct).length === 0) && (!data.repeaters || Object.keys(data.repeaters).length === 0)) {
				return '<em>No credits to migrate.</em>';
			}
			var html = '';
			if (data.direct && Object.keys(data.direct).length) {
				html += '<p><strong>Direct fields:</strong></p><ul style="margin: 0 0 1rem 1.5rem;">';
				for (var k in data.direct) {
					html += '<li><code>' + k + '</code>: ' + ('' + data.direct[k]).substring(0, 80) + (('' + data.direct[k]).length > 80 ? '…' : '') + '</li>';
				}
				html += '</ul>';
			}
			if (data.repeaters && Object.keys(data.repeaters).length) {
				html += '<p><strong>Additional credits (repeaters):</strong></p><ul style="margin: 0 0 0 1.5rem;">';
				for (var rep in data.repeaters) {
					data.repeaters[rep].forEach(function(row) {
						html += '<li><code>' + rep + '</code> – ' + row.role + ': ' + ('' + row.names).substring(0, 60) + (('' + row.names).length > 60 ? '…' : '') + '</li>';
					});
				}
				html += '</ul>';
			}
			return html || '<em>No credits.</em>';
		}

		document.getElementById('vp-credits-migrate-all').addEventListener('click', function() {
			if (!confirm('Migrate credits for all <?php echo count( $posts ); ?> portfolio items? This will write to the new ACF fields. Old fields will not be removed.')) return;
			var btn = this;
			btn.disabled = true;
			btn.textContent = 'Migrating...';
			fetch(ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: 'action=vp_credits_migrate_all&nonce=' + encodeURIComponent(nonce)
			})
			.then(function(r) { return r.json(); })
			.then(function(data) {
				if (data.success) {
					var d = data.data;
					var msg = 'Migrated ' + d.done + ' of ' + d.total + ' posts (' + d.total_credits + ' credits).';
					if (d.errors && d.errors.length) msg += ' Errors: ' + d.errors.join('; ');
					showResult(msg);
					location.reload();
				} else {
					showResult((data.data && data.data.message) || 'Error', true);
				}
			})
			.catch(function() { showResult('Request failed.', true); })
			.finally(function() {
				btn.disabled = false;
				btn.textContent = 'Migrate all <?php echo count( $posts ); ?> posts';
			});
		});

		document.querySelectorAll('.vp-credits-preview').forEach(function(btn) {
			btn.addEventListener('click', function() {
				if (btn.disabled) return;
				var id = this.getAttribute('data-id');
				fetch(ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: 'action=vp_credits_migrate_preview&nonce=' + encodeURIComponent(nonce) + '&post_id=' + id
				})
				.then(function(r) { return r.json(); })
				.then(function(data) {
					if (data.success && data.data.preview) {
						previewContent.innerHTML = formatPreview(data.data.preview);
						modal.style.display = 'flex';
					}
				});
			});
		});

		document.querySelectorAll('.vp-credits-migrate-one').forEach(function(btn) {
			btn.addEventListener('click', function() {
				if (btn.disabled) return;
				var id = this.getAttribute('data-id');
				if (!confirm('Migrate credits for this portfolio item?')) return;
				var b = this;
				b.disabled = true;
				fetch(ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: 'action=vp_credits_migrate_one&nonce=' + encodeURIComponent(nonce) + '&post_id=' + id
				})
				.then(function(r) { return r.json(); })
				.then(function(data) {
					if (data.success) {
						showResult(data.data.message + ' (Post ID: ' + id + ')');
						var row = document.querySelector('tr[data-post-id="' + id + '"]');
						if (row) row.remove();
					} else {
						showResult((data.data && data.data.message) || 'Error', true);
					}
				})
				.catch(function() { showResult('Request failed.', true); })
				.finally(function() { b.disabled = false; });
			});
		});

		document.getElementById('vp-credits-close-preview').addEventListener('click', function() {
			modal.style.display = 'none';
		});
	})();
	</script>
	<?php
}
