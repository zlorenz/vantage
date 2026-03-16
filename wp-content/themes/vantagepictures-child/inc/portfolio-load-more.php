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

/**
 * For public portfolio loads, send cache-friendly headers so the browser can cache
 * both HIT and MISS responses. WordPress calls nocache_headers() early in admin-ajax.php.
 */
add_filter('nocache_headers', function ($headers) {
  if (!isset($_POST['action']) || $_POST['action'] !== 'vp_portfolio_load_more') {
    return $headers;
  }
  $context = isset($_POST['context']) ? sanitize_key(wp_unslash($_POST['context'] ?? '')) : '';
  if ($context !== 'public') {
    return $headers;
  }
  return [
    'Expires'       => gmdate('D, d M Y H:i:s', time() + 600) . ' GMT',
    'Cache-Control' => 'public, max-age=600',
  ];
}, 10, 1);

/**
 * Normalize filter value for cache key (and query): treat "" and "all" as "no filter".
 * Ensures format=brand-film&industry=all&market=all and industry=&market= use the same cache key.
 */
function vp_portfolio_normalize_filter_for_cache( $value ) {
  if ($value === '' || strtolower((string) $value) === 'all') {
    return '';
  }
  return $value;
}

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

/**
 * Secret for internal pre-warm requests; allows bypassing nonce. Empty if AUTH_KEY not set.
 */
function vp_get_prewarm_secret() {
  return defined('AUTH_KEY') ? 'vp_prewarm_' . AUTH_KEY : '';
}

function vp_portfolio_load_more() {

  // Allow internal pre-warm to bypass nonce when secret is present and valid
  $is_prewarm = (
    isset($_POST['vp_prewarm_secret']) &&
    vp_get_prewarm_secret() !== '' &&
    sanitize_text_field(wp_unslash($_POST['vp_prewarm_secret'])) === vp_get_prewarm_secret()
  );
  if (!$is_prewarm) {
    if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'vp_portfolio_load_more')) {
      wp_send_json_error(['message' => 'Invalid nonce']);
    }
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
  $format_norm   = vp_portfolio_normalize_filter_for_cache($format);
  $industry_norm = vp_portfolio_normalize_filter_for_cache($industry);
  $market_norm   = vp_portfolio_normalize_filter_for_cache($market);

  // TranslatePress: use current language in cache key so /work/ and /zh/工作/ get separate cached HTML (permalinks differ).
  $trp_lang = 'en_US';
  if (class_exists('TRP_Translate_Press')) {
    global $TRP_LANGUAGE;
    $trp_lang = isset($TRP_LANGUAGE) && is_string($TRP_LANGUAGE) ? $TRP_LANGUAGE : 'en_US';
  }
  $lang_suffix = sanitize_key($trp_lang);

  // Cache all public pages (page-aware) so both filters and load-more benefit from caching.
  $is_cacheable_public = ($context === 'public');

  // Cache key includes language, page, normalized filters, context and legacy taxonomy/term.
  $legacy_suffix = '';
  if ($taxonomy && $term) {
    $legacy_suffix = '_' . $taxonomy . '_' . $term;
  }

  if ($is_cacheable_public) {
    $cache_key = sprintf(
      'vp_portfolio_%s_p%d_%s_%s_%s_%s%s',
      $lang_suffix,
      $page,
      $format_norm !== '' ? $format_norm : 'all',
      $industry_norm !== '' ? $industry_norm : 'all',
      $market_norm !== '' ? $market_norm : 'all',
      $context,
      $legacy_suffix
    );

    $cached = get_transient($cache_key);
    if (is_array($cached) && !empty($cached['html'])) {
      header('Cache-Control: public, max-age=600');
      header('X-VP-Cache: HIT');
      wp_send_json_success($cached);
    }
  }

  $args = [
    // Use "per_page + 1" so we can cheaply determine if there's another page
    // without using FOUND_ROWS(). We render at most $per_page items and use
    // the extra one (if present) to set has_more.
    'posts_per_page' => $per_page + 1,
    'paged'          => $page,
    'no_found_rows'  => true,
    'orderby'        => 'date',
    'order'          => 'DESC',
  ];

  /**
   * Build a combined tax_query supporting:
   * - dropdown filters (format/industry/market)
   * - legacy single filter (taxonomy + term)
   * - visibility filter (exclude portfolio_visibility=hidden)
   */
  $tax_query = [];

  // Dropdowns (use normalized values so "all" does not add a clause)
  if ($format_norm) {
    $tax_query[] = [
      'taxonomy' => 'video-format',
      'field'    => 'slug',
      'terms'    => [$format_norm],
    ];
  }

  if ($industry_norm) {
    $tax_query[] = [
      'taxonomy' => 'industry',
      'field'    => 'slug',
      'terms'    => [$industry_norm],
    ];
  }

  if ($market_norm) {
    $tax_query[] = [
      'taxonomy' => 'market',
      'field'    => 'slug',
      'terms'    => [$market_norm],
    ];
  }

  // Legacy tabs (taxonomy + term) — only apply if it doesn’t duplicate a dropdown
  // This keeps your old `.vp-filters` UI working while you transition to dropdowns.
  if ($taxonomy && $term) {

    $is_duplicate =
      ($taxonomy === 'video-format' && $term === $format_norm) ||
      ($taxonomy === 'industry' && $term === $industry_norm) ||
      ($taxonomy === 'market' && $term === $market_norm);

    if (!$is_duplicate) {
      $tax_query[] = [
        'taxonomy' => $taxonomy,
        'field'    => 'slug',
        'terms'    => [$term],
      ];
    }
  }

  // Visibility: exclude items explicitly marked as "hidden".
  // Items with no portfolio_visibility term are treated as public.
  $tax_query[] = [
    'taxonomy' => 'portfolio_visibility',
    'field'    => 'slug',
    'terms'    => ['hidden'],
    'operator' => 'NOT IN',
  ];

  if (!empty($tax_query)) {
    $tax_query['relation'] = 'AND';
    $args['tax_query'] = $tax_query;
  }

  $query = vp_get_portfolio_query($args);

  $col_class = 'col-12 col-sm-6 col-md-4 col-lg-3';

  ob_start();

  $rendered = 0;
  $has_more = false;

  if ($query->have_posts()) {
    while ($query->have_posts()) {
      $query->the_post();
      $rendered++;

      // We requested per_page + 1 posts. If we hit the extra record, don't render it
      // but record that there is another page.
      if ($rendered > $per_page) {
        $has_more = true;
        break;
      }
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
    'has_more'  => $has_more,
    'next_page' => $page + 1,
  ];

  if ($is_cacheable_public) {
    // Cache this page payload. We track all keys in an option so purge can clear them.
    if (!isset($cache_key)) {
      $cache_key = sprintf(
        'vp_portfolio_%s_p%d_%s_%s_%s_%s%s',
        $lang_suffix,
        $page,
        $format_norm !== '' ? $format_norm : 'all',
        $industry_norm !== '' ? $industry_norm : 'all',
        $market_norm !== '' ? $market_norm : 'all',
        $context,
        $legacy_suffix
      );
    }

    set_transient($cache_key, $payload, 30 * MINUTE_IN_SECONDS);
    $keys = get_option('vp_portfolio_filter_cache_keys', []);
    if (!in_array($cache_key, $keys, true)) {
      $keys[] = $cache_key;
      update_option('vp_portfolio_filter_cache_keys', array_slice($keys, -100));
    }
    header('X-VP-Cache: MISS');
  }

  wp_send_json_success($payload);
}