<?php
/**
 * Plugin Name: VP Content Types
 * Description: Registers core content types for Vantage Pictures (e.g., Portfolio) independent of any theme.
 * Version: 1.1.0
 * Author: Vantage Pictures
 */

if (!defined('ABSPATH')) exit;

/**
 * Registers CPT + taxonomies.
 */
add_action('init', function () {

  // -----------------------------
  // Portfolio (CPT)
  // -----------------------------
  register_post_type('portfolio', [
    'labels' => [
      'name'          => __('Portfolio', 'vp'),
      'singular_name' => __('Portfolio Item', 'vp'),
      'add_new_item'  => __('Add New Portfolio Item', 'vp'),
      'new_item'      => __('New Portfolio Item', 'vp'),
      'edit_item'     => __('Edit Portfolio Item', 'vp'),
      'view_item'     => __('View Portfolio Item', 'vp'),
      'search_items'  => __('Search Portfolio', 'vp'),
    ],
    'menu_icon'           => 'dashicons-portfolio',
    'public'              => true,
    'publicly_queryable'  => true,
    'show_ui'             => true,
    'show_in_rest'        => true,
    'has_archive'         => false,
    'rewrite'             => ['slug' => 'portfolio', 'with_front' => false],
    'supports'            => ['title', 'editor', 'excerpt', 'thumbnail', 'comments'],
    'capability_type'     => 'post',
    'exclude_from_search' => false,
  ]);

  // -----------------------------
  // Video Formats
  // -----------------------------
  register_taxonomy('video-format', ['portfolio'], [
    'labels' => [
      'name'          => __('Video Formats', 'vp'),
      'singular_name' => __('Video Format', 'vp'),
      'menu_name'     => __('Video Formats', 'vp'),
    ],
    'hierarchical' => true,
    'public'       => true,
    'show_ui'      => true,
    'show_in_rest' => true,
    'query_var'    => true,
    'rewrite'      => ['slug' => 'video-format', 'with_front' => false],
  ]);

  // -----------------------------
  // Industries
  // -----------------------------
  register_taxonomy('industry', ['portfolio'], [
    'labels' => [
      'name'          => __('Industries', 'vp'),
      'singular_name' => __('Industry', 'vp'),
      'menu_name'     => __('Industries', 'vp'),
    ],
    'hierarchical' => true,
    'public'       => true,
    'show_ui'      => true,
    'show_in_rest' => true,
    'query_var'    => true,
    'rewrite'      => ['slug' => 'industry', 'with_front' => false],
  ]);

  // -----------------------------
  // Markets
  // -----------------------------
  register_taxonomy('market', ['portfolio'], [
    'labels' => [
      'name'          => __('Markets', 'vp'),
      'singular_name' => __('Market', 'vp'),
      'menu_name'     => __('Markets', 'vp'),
    ],
    'hierarchical' => true,
    'public'       => true,
    'show_ui'      => true,
    'show_in_rest' => true,
    'query_var'    => true,
    'rewrite'      => ['slug' => 'market', 'with_front' => false],
  ]);

}, 0);


/**
 * One-time migration
 * Converts legacy taxonomy "portfolio-category" → "video-format"
 */
add_action('admin_init', function () {

  if (get_option('vp_migrated_portfolio_category_to_video_format') === '1') return;

  global $wpdb;

  $exists = $wpdb->get_var(
    "SELECT COUNT(*) FROM {$wpdb->term_taxonomy} WHERE taxonomy='portfolio-category'"
  );

  if ($exists) {
    $wpdb->query(
      "UPDATE {$wpdb->term_taxonomy}
       SET taxonomy='video-format'
       WHERE taxonomy='portfolio-category'"
    );
  }

  update_option('vp_migrated_portfolio_category_to_video_format', '1');

});


/**
 * Flush rewrites when plugin activates/deactivates
 */
register_activation_hook(__FILE__, function () {
  flush_rewrite_rules();
});

register_deactivation_hook(__FILE__, function () {
  flush_rewrite_rules();
});