<?php
/**
 * WPBakery Portfolio Migration: Additional Videos
 *
 * Extracts additional videos from WPBakery shortcodes in portfolio post_content
 * and saves to ACF repeater field "additional_videos" (vimeo_link, long_title, description).
 *
 * Skips crew credits (ninja_tables). Does not modify post_content.
 *
 * Usage: Tools → VP Portfolio Videos Migrate
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get portfolio posts that contain WPBakery shortcodes.
 *
 * @return WP_Post[]
 */
function vp_portfolio_migrate_get_affected() {
	global $wpdb;
	$like = '%' . $wpdb->esc_like( '[vc_' ) . '%';
	$ids = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_type = 'portfolio' AND post_status IN ('publish', 'draft', 'pending') AND post_content LIKE %s ORDER BY post_date DESC",
			$like
		)
	);
	if ( empty( $ids ) ) {
		return [];
	}
	return array_map( 'get_post', array_filter( $ids ) );
}

/**
 * Decode vc_raw_html base64 payload.
 * WPBakery stores: base64( rawurlencode( html ) ) or base64( html ).
 *
 * @param string $encoded Base64 string.
 * @return string Decoded HTML or empty string.
 */
function vp_portfolio_migrate_decode_raw_html( $encoded ) {
	$encoded = trim( wp_strip_all_tags( $encoded ) );
	if ( empty( $encoded ) ) {
		return '';
	}
	$decoded = base64_decode( $encoded, true );
	if ( $decoded !== false ) {
		$decoded = rawurldecode( $decoded );
	}
	if ( empty( $decoded ) ) {
		$decoded = rawurldecode( $encoded );
	}
	return $decoded ? $decoded : '';
}

/**
 * Extract title HTML from decoded content containing folio-long-title div.
 * Preserves span, br, div for varied text styles.
 *
 * @param string $html Decoded HTML.
 * @return string Sanitized title HTML (or empty).
 */
function vp_portfolio_migrate_extract_title_html( $html ) {
	if ( strpos( $html, 'folio-long-title' ) === false ) {
		return '';
	}
	if ( preg_match( '/<div[^>]*folio-long-title[^>]*>(.*?)<\/div>/s', $html, $m ) ) {
		$inner = trim( $m[1] );
		$allowed = [
			'span' => [ 'class' => true ],
			'br'   => [],
			'div'  => [ 'class' => true ],
		];
		return wp_kses( $inner, $allowed );
	}
	return '';
}

/**
 * Extract description HTML from decoded content containing video-description div.
 *
 * @param string $html Decoded HTML.
 * @return string Sanitized description HTML (or empty).
 */
function vp_portfolio_migrate_extract_description_html( $html ) {
	if ( strpos( $html, 'video-description' ) === false ) {
		return '';
	}
	if ( preg_match( '/<div[^>]*video-description[^>]*>(.*?)<\/div>/s', $html, $m ) ) {
		return wp_kses_post( trim( $m[1] ) );
	}
	return '';
}

/**
 * Extract description from content (vc_raw_html decoded HTML or vc_column_text).
 *
 * @param string $content HTML or shortcode content to search.
 * @param bool   $decode  If true, treat content as base64 vc_raw_html payload.
 * @return string Description HTML or empty.
 */
function vp_portfolio_migrate_extract_description_from_content( $content, $decode = false ) {
	$html = $decode ? vp_portfolio_migrate_decode_raw_html( $content ) : $content;
	if ( empty( $html ) ) {
		return '';
	}
	return vp_portfolio_migrate_extract_description_html( $html );
}

/**
 * Extract additional videos from a vc_row block.
 *
 * @param string $row_content     Inner content of one [vc_row]...[/vc_row].
 * @param string $next_row_content Optional. Content of the immediately following row (for descriptions in separate rows).
 * @return array|null Assoc array with vimeo_link, long_title, description; or null if not an additional-video row.
 */
function vp_portfolio_migrate_extract_video_from_row( $row_content, $next_row_content = '' ) {
	// Must contain vc_video (additional videos use vc_video; main video uses vc_acf).
	if ( strpos( $row_content, '[vc_video' ) === false ) {
		return null;
	}

	// Extract vimeo URL from [vc_video link="..."]
	if ( ! preg_match( '/\[vc_video\s+link=["\']([^"\']+)["\'][^\]]*\]/', $row_content, $vm ) ) {
		return null;
	}
	$vimeo_url = esc_url_raw( trim( $vm[1] ) );
	if ( empty( $vimeo_url ) || strpos( $vimeo_url, 'vimeo.com' ) === false ) {
		return null;
	}

	// Extract title and description from all [vc_raw_html] blocks in this row.
	// Titles use folio-long-title div (may contain span for styles); descriptions use video-description div.
	$title       = '';
	$description = '';
	if ( preg_match_all( '/\[vc_raw_html(?:\s[^\]]*)?\](.*?)\[\/vc_raw_html\]/s', $row_content, $raw_matches, PREG_SET_ORDER ) ) {
		foreach ( $raw_matches as $rh ) {
			$decoded = vp_portfolio_migrate_decode_raw_html( $rh[1] );
			if ( empty( $decoded ) ) {
				continue;
			}
			if ( empty( $title ) ) {
				$title = vp_portfolio_migrate_extract_title_html( $decoded );
			}
			if ( empty( $description ) ) {
				$description = vp_portfolio_migrate_extract_description_html( $decoded );
			}
			if ( $title && $description ) {
				break;
			}
		}
	}

	// If no description in this row, check vc_column_text (plain HTML, not base64).
	if ( empty( $description ) && preg_match_all( '/\[vc_column_text(?:\s[^\]]*)?\](.*?)\[\/vc_column_text\]/s', $row_content, $ct_matches, PREG_SET_ORDER ) ) {
		foreach ( $ct_matches as $ct ) {
			$description = vp_portfolio_migrate_extract_description_html( $ct[1] );
			if ( $description ) {
				break;
			}
		}
	}

	// If still no description, check the next row (common: title+video in row 1, description in row 2).
	if ( empty( $description ) && $next_row_content !== '' ) {
		// vc_raw_html in next row.
		if ( preg_match_all( '/\[vc_raw_html(?:\s[^\]]*)?\](.*?)\[\/vc_raw_html\]/s', $next_row_content, $raw_matches, PREG_SET_ORDER ) ) {
			foreach ( $raw_matches as $rh ) {
				$description = vp_portfolio_migrate_extract_description_from_content( $rh[1], true );
				if ( $description ) {
					break;
				}
			}
		}
		// vc_column_text in next row.
		if ( empty( $description ) && preg_match_all( '/\[vc_column_text(?:\s[^\]]*)?\](.*?)\[\/vc_column_text\]/s', $next_row_content, $ct_matches, PREG_SET_ORDER ) ) {
			foreach ( $ct_matches as $ct ) {
				$description = vp_portfolio_migrate_extract_description_html( $ct[1] );
				if ( $description ) {
					break;
				}
			}
		}
		// Plain video-description div in next row (e.g. after shortcodes stripped).
		if ( empty( $description ) && strpos( $next_row_content, 'video-description' ) !== false ) {
			$description = vp_portfolio_migrate_extract_description_html( $next_row_content );
		}
	}

	return [
		'vimeo_link'   => $vimeo_url,
		'long_title'   => $title,
		'description'  => $description,
	];
}

/**
 * Parse portfolio post content and extract all additional videos.
 *
 * @param string $content Raw post_content.
 * @return array[] List of assoc arrays (vimeo_link, long_title, description).
 */
function vp_portfolio_migrate_parse_additional_videos( $content ) {
	if ( empty( $content ) || strpos( $content, '[vc_row' ) === false ) {
		return [];
	}

	$videos = [];
	$patt = '/\[vc_row[^\]]*\](.*?)\[\/vc_row\]/s';

	if ( ! preg_match_all( $patt, $content, $matches, PREG_SET_ORDER ) ) {
		return [];
	}

	foreach ( $matches as $i => $m ) {
		$row    = isset( $m[1] ) ? $m[1] : '';
		$next   = isset( $matches[ $i + 1 ][1] ) ? $matches[ $i + 1 ][1] : '';
		$video  = vp_portfolio_migrate_extract_video_from_row( $row, $next );
		if ( $video ) {
			$videos[] = $video;
		}
	}

	return $videos;
}

/**
 * Run migration for a single portfolio post.
 *
 * @param int $post_id Portfolio post ID.
 * @param bool $dry_run If true, do not save to ACF.
 * @return array ['success' => bool, 'count' => int, 'message' => string].
 */
function vp_portfolio_migrate_single_post( $post_id, $dry_run = false ) {
	$post = get_post( $post_id );
	if ( ! $post || $post->post_type !== 'portfolio' ) {
		return [ 'success' => false, 'count' => 0, 'message' => 'Invalid post.' ];
	}

	$videos = vp_portfolio_migrate_parse_additional_videos( $post->post_content );

	if ( empty( $videos ) ) {
		return [ 'success' => true, 'count' => 0, 'message' => 'No additional videos found.' ];
	}

	if ( ! $dry_run && function_exists( 'update_field' ) ) {
		update_field( 'additional_videos', $videos, $post_id );
	}

	return [ 'success' => true, 'count' => count( $videos ), 'message' => sprintf( 'Extracted %d additional video(s).', count( $videos ) ) ];
}

/**
 * Register admin menu.
 */
add_action( 'admin_menu', function () {
	add_management_page(
		'VP Portfolio Videos Migrate',
		'VP Portfolio Videos Migrate',
		'edit_posts',
		'vp-portfolio-videos-migrate',
		'vp_portfolio_migrate_render_admin_page'
	);
}, 11 );

/**
 * AJAX: Dry run (preview) for a single post.
 */
add_action( 'wp_ajax_vp_portfolio_migrate_preview', function () {
	check_ajax_referer( 'vp_portfolio_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
	if ( ! $post_id ) {
		wp_send_json_error( [ 'message' => 'Invalid post ID' ] );
	}
	$result = vp_portfolio_migrate_single_post( $post_id, true );
	$post = get_post( $post_id );
	$videos = vp_portfolio_migrate_parse_additional_videos( $post->post_content );
	wp_send_json_success( [
		'result' => $result,
		'videos' => $videos,
	] );
} );

/**
 * AJAX: Migrate a single post.
 */
add_action( 'wp_ajax_vp_portfolio_migrate_one', function () {
	check_ajax_referer( 'vp_portfolio_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
	if ( ! $post_id ) {
		wp_send_json_error( [ 'message' => 'Invalid post ID' ] );
	}
	$result = vp_portfolio_migrate_single_post( $post_id, false );
	wp_send_json_success( $result );
} );

/**
 * AJAX: Migrate all affected portfolio posts.
 */
add_action( 'wp_ajax_vp_portfolio_migrate_all', function () {
	check_ajax_referer( 'vp_portfolio_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$posts = vp_portfolio_migrate_get_affected();
	$done = 0;
	$total_videos = 0;
	$errors = [];
	foreach ( $posts as $post ) {
		$result = vp_portfolio_migrate_single_post( $post->ID, false );
		if ( $result['success'] ) {
			$done++;
			$total_videos += $result['count'];
		} else {
			$errors[] = $post->post_title . ': ' . $result['message'];
		}
	}
	wp_send_json_success( [
		'done'          => $done,
		'total'         => count( $posts ),
		'total_videos'  => $total_videos,
		'errors'        => $errors,
	] );
} );

/**
 * Render the admin migration page.
 */
function vp_portfolio_migrate_render_admin_page() {
	$posts = vp_portfolio_migrate_get_affected();
	$nonce = wp_create_nonce( 'vp_portfolio_migrate' );
	?>
	<div class="wrap">
		<h1>VP Portfolio Additional Videos Migration</h1>
		<p>Extracts additional videos from WPBakery shortcodes in portfolio post content and saves to the ACF repeater <strong>additional_videos</strong>.</p>
		<ul>
			<li>Parses <code>[vc_row]</code> blocks for <code>[vc_video link="..."]</code></li>
			<li>Extracts titles from <code>[vc_raw_html]</code> (base64-decoded)</li>
			<li>Skips crew credits (ninja_tables) – handled separately later</li>
			<li>Does <strong>not</strong> modify post content</li>
		</ul>

		<?php if ( empty( $posts ) ) : ?>
			<p><strong>No portfolio posts with WPBakery shortcodes found.</strong></p>
			<?php return; ?>
		<?php endif; ?>

		<p><strong><?php echo count( $posts ); ?> portfolio item(s)</strong> contain WPBakery shortcodes.</p>

		<div class="vp-migrate-actions" style="margin: 1.5rem 0;">
			<button type="button" class="button button-primary" id="vp-portfolio-migrate-all">Migrate all <?php echo count( $posts ); ?> posts</button>
		</div>

		<div id="vp-portfolio-migrate-result" style="margin-top: 1rem; display: none;"></div>

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
					<tr data-post-id="<?php echo esc_attr( $post->ID ); ?>">
						<td>
							<strong><?php echo esc_html( $post->post_title ); ?></strong>
							<br><small><?php echo esc_html( get_permalink( $post ) ); ?></small>
						</td>
						<td><?php echo esc_html( get_the_date( '', $post ) ); ?></td>
						<td>
							<a href="<?php echo esc_url( get_edit_post_link( $post->ID, 'raw' ) ); ?>" class="button button-small">Edit</a>
							<a href="<?php echo esc_url( get_permalink( $post ) ); ?>" class="button button-small" target="_blank">View</a>
							<button type="button" class="button button-small vp-portfolio-preview" data-id="<?php echo esc_attr( $post->ID ); ?>">Preview</button>
							<button type="button" class="button button-small button-primary vp-portfolio-migrate-one" data-id="<?php echo esc_attr( $post->ID ); ?>">Migrate</button>
						</td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>

	<div id="vp-portfolio-preview-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100000; align-items: center; justify-content: center;">
		<div style="background: #1e1e1e; color: #e8e8e8; max-width: 600px; max-height: 80vh; overflow: auto; padding: 1.5rem; border-radius: 6px; border: 1px solid #3a3a3a; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
			<h3 style="margin: 0 0 1rem; color: #fff;">Extracted additional videos</h3>
			<div id="vp-portfolio-preview-content" style="border: 1px solid #3a3a3a; padding: 1rem; background: #252525; font-size: 13px; line-height: 1.6;"></div>
			<p style="margin: 1rem 0 0;">
				<button type="button" class="button" id="vp-portfolio-close-preview" style="background: #3a3a3a; color: #e8e8e8; border-color: #4a4a4a;">Close</button>
			</p>
		</div>
	</div>

	<script>
	(function() {
		var nonce = <?php echo json_encode( $nonce ); ?>;
		var resultEl = document.getElementById('vp-portfolio-migrate-result');
		var modal = document.getElementById('vp-portfolio-preview-modal');
		var previewContent = document.getElementById('vp-portfolio-preview-content');

		function showResult(msg, isError) {
			resultEl.style.display = 'block';
			resultEl.className = 'notice notice-' + (isError ? 'error' : 'success');
			resultEl.innerHTML = '<p>' + msg + '</p>';
		}

		document.getElementById('vp-portfolio-migrate-all').addEventListener('click', function() {
			if (!confirm('Migrate additional videos for all <?php echo count( $posts ); ?> portfolio items? This will update the ACF repeater field.')) return;
			var btn = this;
			btn.disabled = true;
			btn.textContent = 'Migrating...';
			fetch(ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: 'action=vp_portfolio_migrate_all&nonce=' + encodeURIComponent(nonce)
			})
			.then(function(r) { return r.json(); })
			.then(function(data) {
				if (data.success) {
					var d = data.data;
					var msg = 'Migrated ' + d.done + ' of ' + d.total + ' posts (' + d.total_videos + ' additional videos).';
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

		document.querySelectorAll('.vp-portfolio-preview').forEach(function(btn) {
			btn.addEventListener('click', function() {
				var id = this.getAttribute('data-id');
				fetch(ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: 'action=vp_portfolio_migrate_preview&nonce=' + encodeURIComponent(nonce) + '&post_id=' + id
				})
				.then(function(r) { return r.json(); })
				.then(function(data) {
					if (data.success && data.data.videos) {
						var v = data.data.videos;
						var html = '<ol>';
						v.forEach(function(item, i) {
							html += '<li style="margin-bottom: 0.75rem;"><strong>' + (item.long_title || '(no title)') + '</strong><br>';
							html += '<small style="color: #aaa;">' + (item.vimeo_link || '') + '</small>';
							if (item.description && item.description.trim()) {
								var desc = item.description.replace(/<[^>]+>/g, ' ').trim();
								desc = desc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
								html += '<br><span style="color: #8f8; font-size: 12px;">' + desc.substring(0, 120) + (desc.length > 120 ? '…' : '') + '</span>';
							}
							html += '</li>';
						});
						html += '</ol>';
						previewContent.innerHTML = html || '<em>No videos found.</em>';
						modal.style.display = 'flex';
					}
				});
			});
		});

		document.querySelectorAll('.vp-portfolio-migrate-one').forEach(function(btn) {
			btn.addEventListener('click', function() {
				var id = this.getAttribute('data-id');
				if (!confirm('Migrate this portfolio item?')) return;
				var b = this;
				b.disabled = true;
				fetch(ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: 'action=vp_portfolio_migrate_one&nonce=' + encodeURIComponent(nonce) + '&post_id=' + id
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

		document.getElementById('vp-portfolio-close-preview').addEventListener('click', function() {
			modal.style.display = 'none';
		});
	})();
	</script>
	<?php
}
