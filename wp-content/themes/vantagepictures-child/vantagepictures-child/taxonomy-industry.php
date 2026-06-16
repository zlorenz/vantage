<?php
/**
 * Taxonomy Template: Industry
 * File: taxonomy-industry.php
 * Theme: vantagepictures-child
 */

get_header();

if (!function_exists('vp_portfolio_thumb_title')) {
  function vp_portfolio_thumb_title($post_id = null) {
    return get_the_title($post_id ?: get_the_ID());
  }
}

$term = get_queried_object();
$taxonomy = $term->taxonomy;

$filter_terms = get_terms([
  'taxonomy' => $taxonomy,
  'hide_empty' => true,
  'orderby' => 'name',
  'order' => 'ASC',
]);

$query = new WP_Query([
  'post_type'      => 'portfolio',
  'posts_per_page' => 12,
  'paged'          => 1,
  'tax_query'      => [
    'relation' => 'AND',
    [
      'taxonomy' => $taxonomy,
      'field'    => 'term_id',
      'terms'    => (int) $term->term_id,
    ],
    [
      'taxonomy' => 'portfolio_visibility',
      'field'    => 'slug',
      'terms'    => ['hidden'],
      'operator' => 'NOT IN',
    ],
  ],
]);

?>

<section class="vp-section py-5 vp-portfolio-taxonomy">
  <div class="container">
    <header class="mb-4 text-center">
      <h1 class="h2 mb-2"><?php echo esc_html($term->name); ?></h1>

      <?php if (!empty($term->description)) : ?>
        <div class="vp-intro text-body-secondary mx-auto">
          <?php echo wp_kses_post(wpautop($term->description)); ?>
        </div>
      <?php endif; ?>
    </header>

    <?php if (!is_wp_error($filter_terms) && !empty($filter_terms)) : ?>
      <nav class="vp-filters" aria-label="Filter portfolio by industry">
        <?php foreach ($filter_terms as $t) :
          $is_active = ($t->term_id === $term->term_id);
        ?>
          <a class="vp-filter<?php echo $is_active ? ' is-active' : ''; ?>"
             href="<?php echo esc_url(get_term_link($t)); ?>">
            <?php echo esc_html($t->name); ?>
          </a>
        <?php endforeach; ?>
      </nav>
    <?php endif; ?>
  </div>

  <?php if ($query->have_posts()) : ?>
    <div id="vp-portfolio-grid" class="vp-portfolio-gallery row g-3 g-md-4">
      <?php while ($query->have_posts()) : $query->the_post(); ?>
        <div class="col-12 col-sm-6 col-md-4 col-lg-3">
          <?php get_template_part('template-parts/portfolio/card'); ?>
        </div>
      <?php endwhile; wp_reset_postdata(); ?>
    </div>

    <?php if ($query->max_num_pages > 1) : ?>
      <div id="vp-load-more"
        class="vp-load-more"
        data-page="1"
        data-per-page="12"
        data-taxonomy="<?php echo esc_attr($taxonomy); ?>"
        data-term="<?php echo esc_attr($term->slug); ?>"
        data-context="public"
        data-layout="taxonomy"
        aria-hidden="true">
      </div>
    <?php endif; ?>

  <?php else : ?>
    <div class="text-center text-body-secondary py-5">
      No portfolio items found in this industry.
    </div>
  <?php endif; ?>
</section>

<?php get_footer(); ?>