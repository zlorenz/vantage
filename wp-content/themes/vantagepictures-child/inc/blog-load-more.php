<?php
/**
 * AJAX: Load more blog posts (offset-based for infinite scroll)
 * POST: nonce, offset, per_page, category_id (optional for category archives)
 */

add_action('wp_ajax_vp_blog_load_more', 'vp_blog_load_more');
add_action('wp_ajax_nopriv_vp_blog_load_more', 'vp_blog_load_more');

function vp_blog_load_more() {

  if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'vp_blog_load_more')) {
    wp_send_json_error(['message' => 'Invalid nonce']);
  }

  $offset   = isset($_POST['offset']) ? max(0, (int) $_POST['offset']) : 0;
  $per_page = isset($_POST['per_page']) ? max(1, min(20, (int) $_POST['per_page'])) : 5;
  $category = isset($_POST['category_id']) ? (int) $_POST['category_id'] : 0;
  $search   = isset($_POST['s']) ? sanitize_text_field(wp_unslash($_POST['s'])) : '';

  $args = [
    'post_status'    => 'publish',
    'posts_per_page' => $per_page,
    'offset'         => $offset,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'ignore_sticky_posts' => true,
  ];

  if ($search !== '') {
    $args['s'] = $search;
    $args['post_type'] = ['post', 'page', 'portfolio'];
  } else {
    $args['post_type'] = 'post';
    if ($category > 0) {
      $args['cat'] = $category;
    }
  }

  $query = new WP_Query($args);

  ob_start();
  if ($query->have_posts()) {
    while ($query->have_posts()) {
      $query->the_post();
      if ($search !== '') {
        get_template_part('template-parts/search/card');
      } else {
        get_template_part('template-parts/blog/card', 'list');
      }
    }
    wp_reset_postdata();
  }
  $html = ob_get_clean();

  $new_offset = $offset + $query->post_count;
  $has_more   = $query->post_count >= $per_page;

  wp_send_json_success([
    'html'       => $html,
    'has_more'   => $has_more,
    'next_offset' => $new_offset,
  ]);
}
