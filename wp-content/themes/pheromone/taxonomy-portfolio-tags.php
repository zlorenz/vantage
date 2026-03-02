<?php
/**
 * Taxonomy archive: Portfolio Tags
 * Bootstrap v3.3.6 compatible layout
 */

get_header();

$term     = get_queried_object();
$taxonomy = isset($term->taxonomy) ? $term->taxonomy : '';
$paged    = max(1, (int) get_query_var('paged'));

function vp_portfolio_fallback_query($taxonomy, $term, $paged) {
  if (empty($taxonomy) || empty($term) || empty($term->term_id)) {
    return null;
  }

  return new WP_Query(array(
    'post_type'      => 'portfolio',
    'post_status'    => 'publish',
    'posts_per_page' => (int) get_option('posts_per_page'),
    'paged'          => $paged,
    'tax_query'      => array(
      array(
        'taxonomy' => $taxonomy,
        'field'    => 'term_id',
        'terms'    => (int) $term->term_id,
      ),
    ),
  ));
}

?>

<div class="main-content">
  <div class="container">
    <div class="row">
      <div class="col-xs-12">

        <header class="page-header">
          <h1 class="page-title"><?php echo esc_html(single_term_title('', false)); ?></h1>

          <?php
          $desc = term_description();
          if (!empty($desc)) : ?>
            <div class="taxonomy-description">
              <?php echo wp_kses_post($desc); ?>
            </div>
          <?php endif; ?>
        </header>

        <?php
        // 1) Prefer the main query (best for pagination, SEO, plugins)
        if (have_posts()) : ?>

          <div class="row">
            <?php while (have_posts()) : the_post(); ?>
              <div class="col-xs-12 col-sm-6 col-md-4">
                <article id="post-<?php the_ID(); ?>" <?php post_class('portfolio-archive-item'); ?>>

                  <a href="<?php the_permalink(); ?>" class="portfolio-thumb-link">
                    <?php if (has_post_thumbnail()) : ?>
                      <?php the_post_thumbnail('large', array('class' => 'img-responsive')); ?>
                    <?php endif; ?>
                  </a>

                  <h3 class="portfolio-archive-title">
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                  </h3>

                </article>
              </div>
            <?php endwhile; ?>
          </div>

          <?php
          $links = paginate_links(array(
            'total'     => (int) $GLOBALS['wp_query']->max_num_pages,
            'current'   => $paged,
            'mid_size'  => 2,
            'prev_text' => '&laquo;',
            'next_text' => '&raquo;',
            'type'      => 'list',
          ));

          if ($links) : ?>
            <nav class="text-center">
              <?php echo $links; ?>
            </nav>
          <?php endif; ?>

        <?php
        // 2) Fallback query if the main query is empty for some reason
        else :
          $fallback = vp_portfolio_fallback_query($taxonomy, $term, $paged);

          if ($fallback && $fallback->have_posts()) : ?>

            <div class="row">
              <?php while ($fallback->have_posts()) : $fallback->the_post(); ?>
                <div class="col-xs-12 col-sm-6 col-md-4">
                  <article id="post-<?php the_ID(); ?>" <?php post_class('portfolio-archive-item'); ?>>

                    <a href="<?php the_permalink(); ?>" class="portfolio-thumb-link">
                      <?php if (has_post_thumbnail()) : ?>
                        <?php the_post_thumbnail('large', array('class' => 'img-responsive')); ?>
                      <?php endif; ?>
                    </a>

                    <h3 class="portfolio-archive-title">
                      <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                    </h3>

                  </article>
                </div>
              <?php endwhile; ?>
            </div>

            <?php
            $links = paginate_links(array(
              'total'     => (int) $fallback->max_num_pages,
              'current'   => $paged,
              'mid_size'  => 2,
              'prev_text' => '&laquo;',
              'next_text' => '&raquo;',
              'type'      => 'list',
            ));

            if ($links) : ?>
              <nav class="text-center">
                <?php echo $links; ?>
              </nav>
            <?php endif; ?>

            <?php wp_reset_postdata(); ?>

          <?php else : ?>
            <p>No portfolio items found with this tag.</p>
          <?php endif; ?>

        <?php endif; ?>

      </div>
    </div>
  </div>
</div>

<?php get_footer(); ?>