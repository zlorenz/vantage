<?php
/**
 * Portfolio query helper
 * Adds optional taxonomy filtering (video-format, industry, market) via GET/POST:
 * - format (video-format)
 * - industry (industry)
 * - market (market)
 */

if (!function_exists('vp_portfolio_build_tax_query_from_request')) {

  function vp_portfolio_build_tax_query_from_request(): array {

    // Map URL/AJAX params => taxonomy names
    $map = [
      'format'   => 'video-format',
      'industry' => 'industry',
      'market'   => 'market',
    ];

    $tax_query = [];

    foreach ($map as $param => $taxonomy) {

      // Support both normal page loads (GET) and AJAX (POST)
      $raw = '';
      if (isset($_POST[$param])) {
        $raw = wp_unslash($_POST[$param]);
      } elseif (isset($_GET[$param])) {
        $raw = wp_unslash($_GET[$param]);
      }

      $slug = sanitize_key($raw);

      if ($slug) {
        $tax_query[] = [
          'taxonomy' => $taxonomy,
          'field'    => 'slug',
          'terms'    => [$slug],
        ];
      }
    }

    if (!empty($tax_query)) {
      $tax_query['relation'] = 'AND';
    }

    return $tax_query;
  }
}

if (!function_exists('vp_get_portfolio_query')) {

  function vp_get_portfolio_query(array $args = []): WP_Query {

    $defaults = [
      'post_type'           => 'portfolio',
      'post_status'         => 'publish',
      'posts_per_page'      => 12,
      'ignore_sticky_posts' => true,

      // If you use page-attributes ordering (menu_order)
      'orderby'             => 'menu_order',
      'order'               => 'ASC',
    ];

    $query_args = wp_parse_args($args, $defaults);

    // If caller did NOT supply tax_query, build from request (GET/POST)
    if (empty($query_args['tax_query'])) {
      $tax_query = vp_portfolio_build_tax_query_from_request();
      if (!empty($tax_query)) {
        $query_args['tax_query'] = $tax_query;
      }
    }

    return new WP_Query($query_args);
  }
}