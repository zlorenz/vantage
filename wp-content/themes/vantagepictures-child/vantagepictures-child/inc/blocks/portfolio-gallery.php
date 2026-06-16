<?php
/**
 * Block: Portfolio Gallery (server-rendered)
 */

add_action('init', function () {

  register_block_type('vantage/portfolio-gallery', [
    'api_version'     => 2,
    'render_callback' => 'vp_render_portfolio_gallery_block',
    'attributes'      => [
      'mode' => ['type' => 'string', 'default' => 'taxonomy'], // taxonomy | manual
      'ids'  => ['type' => 'array',  'default' => []],         // manual IDs

      'taxonomy' => ['type' => 'string', 'default' => 'video-format'],
      'terms'    => ['type' => 'array',  'default' => []],     // term slugs

      'limit' => ['type' => 'number', 'default' => 12],

      // public pages should hide items unless explicitly included
      'includeHidden' => ['type' => 'boolean', 'default' => false],
    ],
  ]);

});

/**
 * Render callback
 */
function vp_render_portfolio_gallery_block($attributes) {

  $mode          = isset($attributes['mode']) ? $attributes['mode'] : 'taxonomy';
  $ids           = isset($attributes['ids']) ? array_map('intval', (array) $attributes['ids']) : [];
  $taxonomy      = isset($attributes['taxonomy']) ? sanitize_key($attributes['taxonomy']) : 'video-format';
  $terms         = isset($attributes['terms']) ? array_map('sanitize_key', (array) $attributes['terms']) : [];
  $limit         = isset($attributes['limit']) ? max(1, (int) $attributes['limit']) : 12;
  $includeHidden = !empty($attributes['includeHidden']);

  $args = [
    'posts_per_page' => $limit,
    'orderby'        => 'date',
    'order'          => 'DESC',
  ];

  // Hide "internal-only" items by default (match /work)
  if (!$includeHidden) {
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

  if ($mode === 'manual' && !empty($ids)) {
    $args['post__in'] = $ids;
    $args['orderby']  = 'post__in'; // preserve manual order
  }

  if ($mode === 'taxonomy' && $taxonomy && !empty($terms)) {
    $args['tax_query'] = [[
      'taxonomy' => $taxonomy,
      'field'    => 'slug',
      'terms'    => $terms,
    ]];
  }

  $q = vp_get_portfolio_query($args);

  ob_start();

  if ($q->have_posts()) : ?>
    <div class="vp-portfolio-gallery">
      <div class="row g-3 g-md-4">
        <?php while ($q->have_posts()) : $q->the_post(); ?>
          <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <?php get_template_part('template-parts/portfolio/card'); ?>
          </div>
        <?php endwhile; wp_reset_postdata(); ?>
      </div>
    </div>
  <?php endif;

  return ob_get_clean();
}