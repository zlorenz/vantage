<?php
/**
 * Taxonomy Template: Market
 * File: taxonomy-market.php
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

$paged = max(1, (int) get_query_var('paged'));

$query = new WP_Query([
  'post_type' => 'portfolio',
  'posts_per_page' => 12,
  'paged' => $paged,
  'tax_query' => [[
    'taxonomy' => $taxonomy,
    'field' => 'term_id',
    'terms' => (int) $term->term_id,
  ]],

  'meta_query' => [
    'relation' => 'OR',
    [
      'key' => 'hide_from_public',
      'compare' => 'NOT EXISTS',
    ],
    [
      'key' => 'hide_from_public',
      'value' => '1',
      'compare' => '!=',
    ],
  ],
]);

?>

<section class="vp-section py-5">
  <div class="container">
    <header class="mb-4 text-center">
      <h1 class="h2 mb-2"><?php echo esc_html($term->name); ?></h1>

      <?php if (!empty($term->description)) : ?>
        <div class="vp-intro text-body-secondary mx-auto" style="max-width: 900px;">
          <?php echo wp_kses_post(wpautop($term->description)); ?>
        </div>
      <?php endif; ?>
    </header>

    <?php if (!is_wp_error($filter_terms) && !empty($filter_terms)) : ?>
      <nav class="vp-filters" aria-label="Filter portfolio by format">
        <a class="vp-filter<?php echo is_page('work') ? ' is-active' : ''; ?>"
           href="<?php echo esc_url(home_url('/work/')); ?>">All</a>

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

    <?php if ($query->have_posts()) : ?>
      <div class="row g-3 g-md-4">
        <?php while ($query->have_posts()) : $query->the_post(); ?>
          <div class="col-12 col-md-6 col-lg-4">
            <a class="vp-card d-block position-relative overflow-hidden text-decoration-none"
               href="<?php the_permalink(); ?>">
              <?php if (has_post_thumbnail()) : ?>
                <div class="ratio ratio-16x9">
                  <?php the_post_thumbnail('large', [
                    'class' => 'w-100 h-100 object-fit-cover',
                    'alt' => the_title_attribute(['echo' => false]),
                    'loading' => 'lazy',
                  ]); ?>
                </div>
              <?php else : ?>
                <div class="ratio ratio-16x9 bg-dark"></div>
              <?php endif; ?>

              <div class="vp-card__label position-absolute start-50 translate-middle-x text-white text-uppercase fw-semibold"
                   style="bottom: 12px; letter-spacing: .08em; font-size: 12px; text-shadow: 0 2px 10px rgba(0,0,0,.8);">
                <?php echo esc_html(vp_portfolio_thumb_title()); ?>
              </div>
            </a>
          </div>
        <?php endwhile; wp_reset_postdata(); ?>
      </div>

      <?php
        $links = paginate_links([
          'total' => (int) $query->max_num_pages,
          'current' => $paged,
          'type' => 'array',
          'prev_text' => '&lsaquo;',
          'next_text' => '&rsaquo;',
        ]);
      ?>

      <?php if (!empty($links)) : ?>
        <nav class="mt-5" aria-label="Portfolio pagination">
          <ul class="pagination justify-content-center">
            <?php foreach ($links as $link) : ?>
              <li class="page-item<?php echo strpos($link, 'current') !== false ? ' active' : ''; ?>">
                <?php echo str_replace('page-numbers', 'page-link', $link); ?>
              </li>
            <?php endforeach; ?>
          </ul>
        </nav>
      <?php endif; ?>

    <?php else : ?>
      <div class="text-center text-body-secondary py-5">
        No portfolio items found in this market.
      </div>
    <?php endif; ?>
  </div>
</section>

<?php get_footer(); ?>