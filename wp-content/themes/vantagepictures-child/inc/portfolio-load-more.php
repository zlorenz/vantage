<?php
/**
 * AJAX: Load more portfolio cards
 * Supports multi-taxonomy filtering via POST params:
 * - format (video-format)
 * - industry (industry)
 * - market (market)
 * Also keeps backward compatibility with legacy single filter params:
 * - taxonomy + term
 */

add_action('wp_ajax_vp_portfolio_load_more', 'vp_portfolio_load_more');
add_action('wp_ajax_nopriv_vp_portfolio_load_more', 'vp_portfolio_load_more');

/** Purge cached first-page HTML when portfolio content changes. */
add_action('save_post_portfolio', 'vp_portfolio_purge_page1_cache');
add_action('transition_post_status', function ($new_status, $old_status, $post) {
  if ($post->post_type === 'portfolio') {
    vp_portfolio_purge_page1_cache($post->ID);
  }
}, 10, 3);

function vp_portfolio_purge_page1_cache( $post_id = 0 ) {
  delete_transient('vp_portfolio_page1_public');
  $keys = get_option('vp_portfolio_filter_cache_keys', []);
  foreach ($keys as $key) {
    delete_transient($key);
  }
  update_option('vp_portfolio_filter_cache_keys', []);
}

function vp_portfolio_load_more() {

  // Basic nonce check
  if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'vp_portfolio_load_more')) {
    wp_send_json_error(['message' => 'Invalid nonce']);
  }

  $page     = isset($_POST['page']) ? max(1, (int) $_POST['page']) : 1;
  $per_page = isset($_POST['per_page']) ? max(1, (int) $_POST['per_page']) : 12;

  // Legacy single-filter inputs (kept for backward compatibility)
  $taxonomy = isset($_POST['taxonomy']) ? sanitize_key(wp_unslash($_POST['taxonomy'])) : '';
  $term     = isset($_POST['term']) ? sanitize_key(wp_unslash($_POST['term'])) : '';

  $context  = isset($_POST['context']) ? sanitize_key(wp_unslash($_POST['context'])) : 'public';
  $layout   = isset($_POST['layout']) ? sanitize_key(wp_unslash($_POST['layout'])) : '';

  // New multi-filter inputs (dropdowns)
  $format   = isset($_POST['format']) ? sanitize_key(wp_unslash($_POST['format'])) : '';
  $industry = isset($_POST['industry']) ? sanitize_key(wp_unslash($_POST['industry'])) : '';
  $market   = isset($_POST['market']) ? sanitize_key(wp_unslash($_POST['market'])) : '';

  // Serve cached HTML for page 1, public (no filter or any filter combo) — faster filter UX.
  $is_first_page_public = ($page === 1 && $context === 'public');
  if ($is_first_page_public) {
    $cache_key = 'vp_portfolio_p1_public_' . $format . '_' . $industry . '_' . $market;
    $cached = get_transient($cache_key);
    if (is_array($cached) && !empty($cached['html'])) {
      wp_send_json_success([
        'html'      => $cached['html'],
        'has_more'  => !empty($cached['has_more']),
        'next_page' => 2,
      ]);
    }
  }

  $args = [
    'posts_per_page' => $per_page,
    'paged'          => $page,
    'orderby'        => 'date',
    'order'          => 'DESC',
  ];

  // PUBLIC page should hide items
  if ($context === 'public') {
    $args['meta_query'] = [
      'relation' => 'OR',
      [
        'key'     => 'hide_from_public',
        'value'   => 0,
        'compare' => '=',
        'type'    => 'NUMERIC',
      ],
      [
        'key'     => 'hide_from_public',
        'compare' => 'NOT EXISTS',
      ],
    ];
  }

  /**
   * Build a combined tax_query supporting:
   * - dropdown filters (format/industry/market)
   * - legacy single filter (taxonomy + term)
   */
  $tax_query = [];

  // Dropdowns
  if ($format) {
    $tax_query[] = [
      'taxonomy' => 'video-format',
      'field'    => 'slug',
      'terms'    => [$format],
    ];
  }

  if ($industry) {
    $tax_query[] = [
      'taxonomy' => 'industry',
      'field'    => 'slug',
      'terms'    => [$industry],
    ];
  }

  if ($market) {
    $tax_query[] = [
      'taxonomy' => 'market',
      'field'    => 'slug',
      'terms'    => [$market],
    ];
  }

  // Legacy tabs (taxonomy + term) — only apply if it doesn’t duplicate a dropdown
  // This keeps your old `.vp-filters` UI working while you transition to dropdowns.
  if ($taxonomy && $term) {

    $is_duplicate =
      ($taxonomy === 'video-format' && $term === $format) ||
      ($taxonomy === 'industry' && $term === $industry) ||
      ($taxonomy === 'market' && $term === $market);

    if (!$is_duplicate) {
      $tax_query[] = [
        'taxonomy' => $taxonomy,
        'field'    => 'slug',
        'terms'    => [$term],
      ];
    }
  }

  if (!empty($tax_query)) {
    $tax_query['relation'] = 'AND';
    $args['tax_query'] = $tax_query;
  }

  $query = vp_get_portfolio_query($args);

  $col_class = ($layout === 'taxonomy') ? 'col-12 col-md-6 col-lg-4' : 'col-12 col-sm-6 col-md-4 col-lg-3';

  ob_start();

  if ($query->have_posts()) {
    while ($query->have_posts()) {
      $query->the_post();
      ?>
      <div class="<?php echo esc_attr($col_class); ?>">
        <?php get_template_part('template-parts/portfolio/card'); ?>
      </div>
      <?php
    }
    wp_reset_postdata();
  }

  $html = ob_get_clean();

  $payload = [
    'html'      => $html,
    'has_more'  => ($page < (int) $query->max_num_pages),
    'next_page' => $page + 1,
  ];

  if ($is_first_page_public) {
    $cache_key = 'vp_portfolio_p1_public_' . $format . '_' . $industry . '_' . $market;
    set_transient($cache_key, $payload, 10 * MINUTE_IN_SECONDS);
    $keys = get_option('vp_portfolio_filter_cache_keys', []);
    if (!in_array($cache_key, $keys, true)) {
      $keys[] = $cache_key;
      update_option('vp_portfolio_filter_cache_keys', array_slice($keys, -100));
    }
  }

  wp_send_json_success($payload);
}