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

  wp_send_json_success([
    'html'      => $html,
    'has_more'  => ($page < (int) $query->max_num_pages),
    'next_page' => $page + 1,
  ]);
}