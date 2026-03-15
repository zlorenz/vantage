<?php
/**
 * Optional manual pre-warm for portfolio filter transient cache.
 * Run via WP-CLI: wp vp prewarm-portfolio
 * Or visit (as admin): any front-end URL with ?vp_prewarm_portfolio=1
 *
 * Does not run automatically. Purge logic is unchanged (save_post_portfolio).
 */

if (!defined('ABSPATH')) {
  exit;
}

/**
 * Pre-warm the most common portfolio filter combinations (page 1, public).
 * Sends internal POST requests to admin-ajax.php with a secret so nonce is bypassed.
 */
function vp_prewarm_portfolio_cache() {
  $secret = function_exists('vp_get_prewarm_secret') ? vp_get_prewarm_secret() : '';
  if ($secret === '') {
    return new WP_Error('vp_prewarm', 'AUTH_KEY not set; pre-warm secret unavailable.');
  }

  $url = admin_url('admin-ajax.php');
  $combos = [
    ['format' => '', 'industry' => '', 'market' => ''],           // unfiltered (all)
    ['format' => '', 'industry' => 'tech', 'market' => ''],       // industry=tech
    ['format' => '', 'industry' => '', 'market' => 'singapore'],  // market=singapore
    ['format' => 'brand-film', 'industry' => '', 'market' => ''], // format=brand-film
  ];

  $results = [];
  foreach ($combos as $combo) {
    $body = array_merge([
      'action'           => 'vp_portfolio_load_more',
      'vp_prewarm_secret' => $secret,
      'page'             => 1,
      'per_page'         => 12,
      'context'          => 'public',
      'taxonomy'         => '',
      'term'             => '',
    ], $combo);

    $res = wp_remote_post($url, [
      'body'    => $body,
      'timeout' => 30,
    ]);

    $code  = wp_remote_retrieve_response_code($res);
    $parts = [];
    foreach ($combo as $k => $v) {
      if ($v !== '') {
        $parts[] = $k . '=' . $v;
      }
    }
    $label   = $parts ? implode(', ', $parts) : 'unfiltered';
    $results[] = sprintf('%s → %s', $label, $code);
  }

  return $results;
}

// Admin URL trigger: ?vp_prewarm_portfolio=1 (admin only)
add_action('init', function () {
  if (!isset($_GET['vp_prewarm_portfolio']) || $_GET['vp_prewarm_portfolio'] !== '1') {
    return;
  }
  if (!current_user_can('manage_options')) {
    return;
  }

  $results = vp_prewarm_portfolio_cache();
  if (is_wp_error($results)) {
    wp_die(esc_html($results->get_error_message()), 'Pre-warm failed', ['response' => 500]);
  }

  $redirect = remove_query_arg('vp_prewarm_portfolio');
  set_transient('vp_prewarm_done_message', implode("\n", $results), 30);
  wp_safe_redirect($redirect);
  exit;
}, 20);

// Show one-time message after redirect (optional)
add_action('admin_notices', function () {
  if (!current_user_can('manage_options')) {
    return;
  }
  $msg = get_transient('vp_prewarm_done_message');
  if ($msg === false) {
    return;
  }
  delete_transient('vp_prewarm_done_message');
  echo '<div class="notice notice-success is-dismissible"><p><strong>Portfolio cache pre-warmed.</strong><br><code>' . esc_html(str_replace("\n", '<br>', $msg)) . '</code></p></div>';
});

// WP-CLI
if (defined('WP_CLI') && WP_CLI && class_exists('WP_CLI')) {
  WP_CLI::add_command('vp prewarm-portfolio', function () {
    $results = vp_prewarm_portfolio_cache();
    if (is_wp_error($results)) {
      WP_CLI::error($results->get_error_message());
    }
    WP_CLI::success('Portfolio cache pre-warmed: ' . implode(', ', $results));
  });
}
