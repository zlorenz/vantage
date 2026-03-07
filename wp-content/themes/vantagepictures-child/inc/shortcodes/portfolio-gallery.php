<?php
/**
 * Shortcode: [vp_portfolio_gallery]
 *
 * Usage:
 *  - Taxonomy mode:
 *    [vp_portfolio_gallery taxonomy="video-format" terms="brand-film,commercial-spot" limit="12"]
 *
 *  - Manual mode (preserves order):
 *    [vp_portfolio_gallery ids="123,456,789" limit="12" include_hidden="0"]
 *
 * Params:
 *  - ids: comma-separated portfolio post IDs (manual mode)
 *  - taxonomy: taxonomy key (default: video-format)
 *  - terms: comma-separated term slugs
 *  - limit: number of items (default: 12)
 *  - include_hidden: 1 to include hide_from_public items (default: 0)
 */

add_shortcode('vp_portfolio_gallery', function ($atts) {

  $atts = shortcode_atts([
    'ids'            => '',
    'taxonomy'       => 'video-format',
    'terms'          => '',
    'limit'          => 12,
    'include_hidden' => 0,
    'orderby'        => 'date',
    'order'          => 'DESC',
    'cols'           => 4,
    'gutter'         => 4,
  ], $atts, 'vp_portfolio_gallery');

  $limit          = max(1, (int) $atts['limit']);
  $cols = (int) $atts['cols'];
  if (!in_array($cols, [2, 3, 4], true)) {
    $cols = 4;
  }

  $col_class = 'col-12 col-sm-6';
  if ($cols === 2) {
    $col_class .= ' col-lg-6';
  } elseif ($cols === 3) {
    $col_class .= ' col-lg-4';
  } else { // 4
    $col_class .= ' col-md-4 col-lg-3';
  }
  $gutter = (int) $atts['gutter'];
  if (!in_array($gutter, [1,2,3,4,5], true)) {
    $gutter = 4;
  }

  $gutter_class = 'g-' . $gutter;
  $include_hidden = ((int) $atts['include_hidden']) === 1;

  $ids = array_values(array_filter(array_map('intval', array_map('trim', explode(',', (string) $atts['ids'])))));

  $taxonomy = sanitize_key((string) $atts['taxonomy']);
  $terms    = array_values(array_filter(array_map('sanitize_key', array_map('trim', explode(',', (string) $atts['terms'])))));

  $args = [
    'posts_per_page' => $limit,
    'orderby'        => sanitize_key((string) $atts['orderby']),
    'order'          => strtoupper((string) $atts['order']) === 'ASC' ? 'ASC' : 'DESC',
  ];

  // Hide internal-only items by default (matches /work behavior)
  if (!$include_hidden) {
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

  // Manual mode (IDs)
  if (!empty($ids)) {
    $args['post__in'] = $ids;
    $args['orderby']  = 'post__in'; // preserve manual order
  } else {
    // Taxonomy mode
    if ($taxonomy && !empty($terms)) {
      $args['tax_query'] = [[
        'taxonomy' => $taxonomy,
        'field'    => 'slug',
        'terms'    => $terms,
      ]];
    }
  }

  $q = vp_get_portfolio_query($args);

  ob_start();

  if ($q->have_posts()) : ?>
    <div class="vp-portfolio-gallery">
      <div class="row <?php echo esc_attr($gutter_class); ?>">
        <?php while ($q->have_posts()) : $q->the_post(); ?>
          <div class="<?php echo esc_attr($col_class); ?>">
            <?php get_template_part('template-parts/portfolio/card'); ?>
          </div>
        <?php endwhile; wp_reset_postdata(); ?>
      </div>
    </div>
  <?php endif;

  return ob_get_clean();
});