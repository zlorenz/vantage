<?php
/**
 * Work Page (All Portfolio Items)
 * File: page-work-internal.php
 */

get_header();

// Hero title (ACF optional)
$hero_title = function_exists('get_field') ? get_field('vp_hero_title') : '';

// Filters
$taxonomy = 'video-format';
$exclude_term_ids = [37];

$filter_terms = get_terms([
  'taxonomy'   => $taxonomy,
  'hide_empty' => true,
  'orderby'    => 'name',
  'order'      => 'ASC',
  'exclude'    => $exclude_term_ids,
]);

$active_slug = isset($_GET['format']) ? sanitize_key(wp_unslash($_GET['format'])) : '';
$active_term = $active_slug ? get_term_by('slug', $active_slug, $taxonomy) : null;

// Query
$paged = max(1, (int) get_query_var('paged'));

$args = [
  'posts_per_page' => 12,
  'paged'          => $paged,
  'orderby'        => 'date',
  'order'          => 'DESC',
];

if ($active_term && !is_wp_error($active_term)) {
  $args['tax_query'] = [[
    'taxonomy' => $taxonomy,
    'field'    => 'term_id',
    'terms'    => (int) $active_term->term_id,
  ]];
}

$query = vp_get_portfolio_query($args);

$hero_style = '';

if (has_post_thumbnail(get_queried_object_id())) {
  $bg_url = get_the_post_thumbnail_url(get_queried_object_id(), 'full');
  if ($bg_url) {
    $hero_style = 'style="background-image: url(' . esc_url($bg_url) . ');"';
  }
}
?>

<header class="vp-page-hero" <?php echo $hero_style; ?>>
  <div class="vp-page-hero__overlay"></div>
  <div class="container vp-page-hero__inner">
    <h1 class="vp-page-hero__title mb-0">
      <?php
      if (!empty($hero_title)) {
        echo wp_kses(
          $hero_title,
          [
            'span' => ['class' => true],
            'br'   => [],
          ]
        );
      } else {
        the_title();
      }
      ?>
    </h1>
  </div>
</header>

<section class="vp-section">
  <div class="container-fluid">

    <?php
    /**
     * Page intro content (SEO / page builder content)
     * Renders the page editor content above the portfolio filters.
     */
    if (have_posts()) :
      while (have_posts()) : the_post();

        $content = trim(get_the_content());

        if (!empty($content)) : ?>
          <div class="vp-work-intro mb-4">
            <?php the_content(); ?>
          </div>
        <?php endif;

      endwhile;
      // IMPORTANT: reset so your portfolio loop below isn't affected
      wp_reset_postdata();
    endif;
    ?>

    <?php vp_portfolio_filter_dropdowns(); ?>

    <?php if ($query->have_posts()) : ?>
      <div id="vp-portfolio-grid" class="row g-3 g-md-3">
        <?php while ($query->have_posts()) : $query->the_post(); ?>
          <div class="col-12 col-sm-6 col-md-4 col-lg-3">
            <?php get_template_part('template-parts/portfolio/card'); ?>
          </div>
        <?php endwhile; wp_reset_postdata(); ?>
      </div>

      <div id="vp-load-more"
           data-page="1"
           data-per-page="12"
           data-taxonomy="<?php echo esc_attr($taxonomy); ?>"
           data-term="<?php echo esc_attr($active_term && !is_wp_error($active_term) ? $active_term->slug : ''); ?>"
           data-context="internal">

           <div class="vp-load-spinner"></div>
           
      </div>

    <?php else : ?>
      <div class="text-center text-body-secondary py-5">
        No portfolio items found.
      </div>
    <?php endif; ?>

  </div>
</section>

<?php get_footer(); ?>