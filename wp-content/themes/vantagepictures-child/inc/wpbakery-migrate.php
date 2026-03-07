<?php
/**
 * WPBakery Content Migration Tool
 *
 * One-time cleanup for posts built with WPBakery/Pheromone.
 * Strips dead shortcodes, decodes vc_raw_html, converts vc_video to oEmbed URLs.
 *
 * Usage: Tools → VP WPBakery Migrate
 *
 * @package vantagepictures-child
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Clean WPBakery shortcodes from post content.
 *
 * @param string $content Raw post content.
 * @return string Cleaned content.
 */
function vp_wpbakery_clean_content( $content ) {
	if ( empty( $content ) || strpos( $content, '[vc_' ) === false ) {
		return $content;
	}

	$content = vp_wpbakery_convert_vc_video( $content );
	$content = vp_wpbakery_convert_vc_raw_html( $content );
	$content = vp_wpbakery_strip_wrapper_shortcodes( $content );
	$content = vp_wpbakery_remove_orphan_shortcodes( $content );
	$content = vp_wpbakery_normalize_whitespace( $content );

	return $content;
}

/**
 * Convert [vc_video link="URL"] to plain URL for WordPress oEmbed.
 */
function vp_wpbakery_convert_vc_video( $content ) {
	return preg_replace_callback(
		'/\[vc_video\s+link=["\']([^"\']+)["\'][^\]]*\]/',
		function ( $m ) {
			return "\n\n" . esc_url( $m[1] ) . "\n\n";
		},
		$content
	);
}

/**
 * Decode and replace vc_raw_html content.
 * WPBakery stores: base64( rawurlencode( html ) ) or base64( html ).
 */
function vp_wpbakery_convert_vc_raw_html( $content ) {
	return preg_replace_callback(
		'/\[vc_raw_html(?:\s[^\]]*)?\](.*?)\[\/vc_raw_html\]/s',
		function ( $m ) {
			$encoded = wp_strip_all_tags( trim( $m[1] ) );
			if ( empty( $encoded ) ) {
				return '';
			}
			// WPBakery: base64_decode then rawurldecode (per vc_raw_html.php)
			$decoded = base64_decode( $encoded, true );
			if ( $decoded !== false ) {
				$decoded = rawurldecode( $decoded );
			}
			// Fallback: some versions may store URL-encoded only
			if ( empty( $decoded ) ) {
				$decoded = rawurldecode( $encoded );
			}
			return $decoded ?: '';
		},
		$content
	);
}

/**
 * Strip passthrough wrapper shortcodes (vc_row, vc_column, vc_column_text, etc.)
 * Keeps inner content. Iterates until no more wrappers remain.
 */
function vp_wpbakery_strip_wrapper_shortcodes( $content ) {
	$wrappers = [ 'vc_column_text', 'vc_column_inner', 'vc_row_inner', 'vc_column', 'vc_row', 'vc_section' ];
	$prev    = '';

	while ( $prev !== $content ) {
		$prev = $content;
		foreach ( $wrappers as $tag ) {
			$content = preg_replace(
				'/\[\s*' . preg_quote( $tag, '/' ) . '(?:\s[^\]]*)?\](.*?)\[\s*\/\s*' . preg_quote( $tag, '/' ) . '\s*\]/s',
				'$1',
				$content
			);
		}
	}

	return $content;
}

/**
 * Remove any remaining vc_ shortcodes that couldn't be unwrapped
 * (e.g. self-closing or malformed).
 */
function vp_wpbakery_remove_orphan_shortcodes( $content ) {
	// Self-closing vc_ shortcodes
	$content = preg_replace( '/\[\s*vc_[^\]]+\s*\/?\]/', '', $content );
	// Opening tags without proper closing (aggressive cleanup)
	$content = preg_replace( '/\[\s*vc_[^\]]*\]/', '', $content );
	$content = preg_replace( '/\[\s*\/\s*vc_[^\]]*\]/', '', $content );
	return $content;
}

/**
 * Normalize excessive whitespace and clean up artifacts.
 */
function vp_wpbakery_normalize_whitespace( $content ) {
	$content = preg_replace( '/\n{3,}/', "\n\n", $content );
	$content = preg_replace( '/<p>\s*<\/p>/', '', $content );
	return trim( $content );
}

/**
 * Get all published posts that contain WPBakery shortcodes.
 *
 * @return WP_Post[]
 */
function vp_wpbakery_get_affected_posts() {
	global $wpdb;
	$like = '%' . $wpdb->esc_like( '[vc_' ) . '%';
	$ids  = $wpdb->get_col(
		$wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' AND post_content LIKE %s ORDER BY post_date DESC",
			$like
		)
	);
	if ( empty( $ids ) ) {
		return [];
	}
	return array_map( 'get_post', $ids );
}

/**
 * Register admin menu and page.
 */
add_action( 'admin_menu', function () {
	add_management_page(
		'VP WPBakery Migrate',
		'VP WPBakery Migrate',
		'edit_posts',
		'vp-wpbakery-migrate',
		'vp_wpbakery_render_admin_page'
	);
} );

/**
 * Handle AJAX actions: preview, clean single, clean all.
 */
add_action( 'wp_ajax_vp_wpbakery_preview', function () {
	check_ajax_referer( 'vp_wpbakery_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
	if ( ! $post_id ) {
		wp_send_json_error( [ 'message' => 'Invalid post ID' ] );
	}
	$post = get_post( $post_id );
	if ( ! $post || $post->post_type !== 'post' ) {
		wp_send_json_error( [ 'message' => 'Post not found' ] );
	}
	$cleaned = vp_wpbakery_clean_content( $post->post_content );
	wp_send_json_success( [ 'content' => $cleaned ] );
} );

add_action( 'wp_ajax_vp_wpbakery_clean_post', function () {
	check_ajax_referer( 'vp_wpbakery_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$post_id = isset( $_POST['post_id'] ) ? (int) $_POST['post_id'] : 0;
	if ( ! $post_id ) {
		wp_send_json_error( [ 'message' => 'Invalid post ID' ] );
	}
	$post = get_post( $post_id );
	if ( ! $post || $post->post_type !== 'post' ) {
		wp_send_json_error( [ 'message' => 'Post not found' ] );
	}
	$cleaned = vp_wpbakery_clean_content( $post->post_content );
	$updated = wp_update_post( [
		'ID'           => $post_id,
		'post_content' => $cleaned,
	], true );
	if ( is_wp_error( $updated ) ) {
		wp_send_json_error( [ 'message' => $updated->get_error_message() ] );
	}
	wp_send_json_success( [ 'message' => 'Post cleaned and saved.' ] );
} );

add_action( 'wp_ajax_vp_wpbakery_clean_all', function () {
	check_ajax_referer( 'vp_wpbakery_migrate', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( [ 'message' => 'Unauthorized' ] );
	}
	$posts = vp_wpbakery_get_affected_posts();
	$done  = 0;
	$errs  = [];
	foreach ( $posts as $post ) {
		$cleaned = vp_wpbakery_clean_content( $post->post_content );
		$updated = wp_update_post( [
			'ID'           => $post->ID,
			'post_content' => $cleaned,
		], true );
		if ( is_wp_error( $updated ) ) {
			$errs[] = $post->post_title . ': ' . $updated->get_error_message();
		} else {
			$done++;
		}
	}
	wp_send_json_success( [
		'done'   => $done,
		'total'  => count( $posts ),
		'errors' => $errs,
	] );
} );

/**
 * Render the admin migration page.
 */
function vp_wpbakery_render_admin_page() {
	$posts = vp_wpbakery_get_affected_posts();
	$nonce = wp_create_nonce( 'vp_wpbakery_migrate' );
	?>
	<div class="wrap">
		<h1>VP WPBakery Content Migration</h1>
		<p>This tool cleans WPBakery shortcodes from blog posts so they work with your new theme and Gutenberg.</p>
		<ul>
			<li>Strips <code>[vc_row]</code>, <code>[vc_column]</code>, <code>[vc_column_text]</code> and similar wrappers</li>
			<li>Decodes <code>[vc_raw_html]</code> (base64/URL-encoded embeds) and inserts the real HTML</li>
			<li>Converts <code>[vc_video link="..."]</code> to plain URLs for WordPress oEmbed</li>
		</ul>

		<?php if ( empty( $posts ) ) : ?>
			<p><strong>No posts with WPBakery shortcodes found.</strong> You're all set.</p>
			<?php return; ?>
		<?php endif; ?>

		<p><strong><?php echo count( $posts ); ?> post(s)</strong> contain WPBakery shortcodes.</p>

		<div class="vp-migrate-actions" style="margin: 1.5rem 0;">
			<button type="button" class="button button-primary" id="vp-clean-all">Clean all <?php echo count( $posts ); ?> posts</button>
		</div>

		<div id="vp-migrate-result" style="margin-top: 1rem; display: none;"></div>

		<table class="wp-list-table widefat fixed striped">
			<thead>
				<tr>
					<th>Post</th>
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
							<button type="button" class="button button-small vp-preview" data-id="<?php echo esc_attr( $post->ID ); ?>">Preview cleaned</button>
							<button type="button" class="button button-small button-primary vp-clean-one" data-id="<?php echo esc_attr( $post->ID ); ?>">Clean & save</button>
						</td>
					</tr>
				<?php endforeach; ?>
			</tbody>
		</table>
	</div>

	<div id="vp-preview-modal" style="display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 100000; align-items: center; justify-content: center;">
		<div style="background: #1e1e1e; color: #e8e8e8; max-width: 900px; max-height: 80vh; overflow: auto; padding: 1.5rem; border-radius: 6px; border: 1px solid #3a3a3a; box-shadow: 0 8px 32px rgba(0,0,0,0.5);">
			<h3 style="margin: 0 0 1rem; color: #fff; font-size: 1.1rem;">Cleaned content preview</h3>
			<div id="vp-preview-content" style="border: 1px solid #3a3a3a; padding: 1rem; background: #252525; color: #d4d4d4; white-space: pre-wrap; font-size: 13px; line-height: 1.5; max-height: 400px; overflow: auto; border-radius: 4px;"></div>
			<p style="margin: 1rem 0 0;">
				<button type="button" class="button" id="vp-close-preview" style="background: #3a3a3a; color: #e8e8e8; border-color: #4a4a4a;">Close</button>
			</p>
		</div>
	</div>

	<script>
	(function() {
		var nonce = <?php echo json_encode( $nonce ); ?>;
		var resultEl = document.getElementById('vp-migrate-result');
		var modal = document.getElementById('vp-preview-modal');
		var previewContent = document.getElementById('vp-preview-content');

		function showResult(msg, isError) {
			resultEl.style.display = 'block';
			resultEl.className = 'notice notice-' + (isError ? 'error' : 'success');
			resultEl.innerHTML = '<p>' + msg + '</p>';
		}

		document.getElementById('vp-clean-all').addEventListener('click', function() {
			if (!confirm('Clean and save all <?php echo count( $posts ); ?> posts? This will overwrite their content.')) return;
			this.disabled = true;
			this.textContent = 'Cleaning...';
			fetch(ajaxurl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
				body: 'action=vp_wpbakery_clean_all&nonce=' + encodeURIComponent(nonce)
			})
			.then(function(r) { return r.json(); })
			.then(function(data) {
				if (data.success) {
					var msg = 'Cleaned ' + data.data.done + ' of ' + data.data.total + ' posts.';
					if (data.data.errors && data.data.errors.length) {
						msg += ' Errors: ' + data.data.errors.join('; ');
					}
					showResult(msg);
					location.reload();
				} else {
					showResult(data.data && data.data.message ? data.data.message : 'Error', true);
				}
			})
			.catch(function() { showResult('Request failed.', true); })
			.finally(function() {
				document.getElementById('vp-clean-all').disabled = false;
				document.getElementById('vp-clean-all').textContent = 'Clean all <?php echo count( $posts ); ?> posts';
			});
		});

		document.querySelectorAll('.vp-preview').forEach(function(btn) {
			btn.addEventListener('click', function() {
				var id = this.getAttribute('data-id');
				fetch(ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: 'action=vp_wpbakery_preview&nonce=' + encodeURIComponent(nonce) + '&post_id=' + id
				})
				.then(function(r) { return r.json(); })
				.then(function(data) {
					if (data.success) {
						previewContent.textContent = data.data.content;
						modal.style.display = 'flex';
					}
				});
			});
		});

		document.querySelectorAll('.vp-clean-one').forEach(function(btn) {
			btn.addEventListener('click', function() {
				var id = this.getAttribute('data-id');
				if (!confirm('Clean and save this post?')) return;
				this.disabled = true;
				fetch(ajaxurl, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: 'action=vp_wpbakery_clean_post&nonce=' + encodeURIComponent(nonce) + '&post_id=' + id
				})
				.then(function(r) { return r.json(); })
				.then(function(data) {
					if (data.success) {
						showResult(data.data.message);
						document.querySelector('tr[data-post-id="' + id + '"]').remove();
					} else {
						showResult(data.data && data.data.message ? data.data.message : 'Error', true);
					}
				})
				.catch(function() { showResult('Request failed.', true); })
				.finally(function() { btn.disabled = false; });
			});
		});

		document.getElementById('vp-close-preview').addEventListener('click', function() {
			modal.style.display = 'none';
		});
	})();
	</script>
	<?php
}
