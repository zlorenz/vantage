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

if (!function_exists('vp_portfolio_flatten_tax_query_clauses')) {

  /** @param array $tax_query Mixed clauses + optional 'relation' key */
  function vp_portfolio_flatten_tax_query_clauses(array $tax_query): array {
    $clauses = [];
    foreach ($tax_query as $k => $v) {
      if ($k === 'relation') {
        continue;
      }
      if (is_numeric($k)) {
        $clauses[] = $v;
      }
    }
    return $clauses;
  }
}

if (!function_exists('vp_portfolio_build_internal_crew_tax_query_from_request')) {

  /**
   * Internal Work page crew filters (client, director, dop, art-director).
   * Returns clause list only (no relation key).
   */
  function vp_portfolio_build_internal_crew_tax_query_from_request(): array {

    $map = [
      'client'       => 'client',
      'director'     => 'director',
      'dop'          => 'dop',
      'art-director' => 'art-director',
    ];

    $clauses = [];

    foreach ($map as $param => $taxonomy) {

      $raw = '';
      if (isset($_POST[$param])) {
        $raw = wp_unslash($_POST[$param]);
      } elseif (isset($_GET[$param])) {
        $raw = wp_unslash($_GET[$param]);
      }

      $slug = sanitize_key($raw);

      if ($slug) {
        $clauses[] = [
          'taxonomy' => $taxonomy,
          'field'    => 'slug',
          'terms'    => [$slug],
        ];
      }
    }

    return $clauses;
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

    $vp_internal_crew = !empty($args['vp_internal_crew']);
    unset($args['vp_internal_crew']);

    $query_args = wp_parse_args($args, $defaults);

    // If caller did NOT supply tax_query, build from request (GET/POST)
    if (empty($query_args['tax_query'])) {
      if ($vp_internal_crew) {
        // Internal Work: crew taxonomies only (not format/industry/market).
        $clauses = vp_portfolio_build_internal_crew_tax_query_from_request();
      } else {
        $clauses = vp_portfolio_flatten_tax_query_clauses(
          vp_portfolio_build_tax_query_from_request()
        );
      }

      if (!empty($clauses)) {
        $clauses['relation'] = 'AND';
        $query_args['tax_query'] = $clauses;
      }
    }

    return new WP_Query($query_args);
  }
}