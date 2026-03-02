<?php
/**
 * Template: Industry Archive
 * Taxonomy: industry
 */

get_header();
vp_output_portfolio_tax_collectionpage_schema();

$term = get_queried_object();
$current_term_id = isset($term->term_id) ? (int) $term->term_id : 0;
?>

<div class="container">
  <div class="row">
    <div class="col-xs-12">

      <header class="page-header">
        <h1 class="page-title"><?php echo esc_html(single_term_title('', false)); ?></h1>

        <?php if (term_description()) : ?>
          <div class="taxonomy-description">
            <?php echo term_description(); ?>
          </div>
        <?php endif; ?>
      </header>

      <?php
      // Industry Filter Nav
      $terms = get_terms(array(
        'taxonomy'   => 'industry',
        'hide_empty' => true,
        'orderby'    => 'name',
        'order'      => 'ASC',
      ));

      if (!is_wp_error($terms) && !empty($terms)) :
        echo '<nav class="vp-portfolio-filter-links text-center" aria-label="Industries">';
        echo '<ul class="vp-filter-list list-inline">';

        foreach ($terms as $t) {
          $is_current = ((int) $current_term_id === (int) $t->term_id);
          $class = $is_current ? ' class="is-active"' : '';
          $url   = get_term_link($t);

          if (!is_wp_error($url)) {
            echo '<li' . $class . '>';
            echo '<a href="' . esc_url($url) . '">' . esc_html($t->name) . '</a>';
            echo '</li>';
          }
        }

        echo '</ul>';
        echo '</nav>';
      endif;
      ?>

    </div>
  </div>
</div>

<div class="container-fluid">
  <!-- Portfolio Grid -->
  <div class="row vp-portfolio-grid">

    <?php if (have_posts()) : ?>
      <?php $count = 0; ?>
      <?php while (have_posts()) : the_post(); ?>

        <?php if ($count % 4 == 0 && $count != 0) : ?>
          <div class="clearfix visible-md-block visible-lg-block"></div>
        <?php endif; ?>

        <?php if ($count % 2 == 0 && $count != 0) : ?>
          <div class="clearfix visible-sm-block"></div>
        <?php endif; ?>

        <div class="col-xs-12 col-sm-6 col-md-3">
          <article class="vp-item">

            <a href="<?php the_permalink(); ?>" class="vp-thumb-link">

              <?php if (has_post_thumbnail()) : ?>
                <div class="vp-thumb">
                  <?php the_post_thumbnail('large', array('class' => 'img-responsive')); ?>
                </div>
              <?php endif; ?>

              <h3 class="vp-title"><?php the_title(); ?></h3>

            </a>

          </article>
        </div>

      <?php $count++; endwhile; ?>
    <?php endif; ?>

  </div>
</div>

<?php get_footer(); ?>