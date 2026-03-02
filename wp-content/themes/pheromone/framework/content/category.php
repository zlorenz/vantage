<?php
/**
 * Category Archive Template (News Categories)
 * File: pheromone/framework/content/category.php
 */

get_header();

$current_term = get_queried_object();
$current_term_id = isset($current_term->term_id) ? (int) $current_term->term_id : 0;

// Post layout class
$post_type_layout = get_theme_mod('pheromone_post_type', 'classic');

$type_class = '';
if ($post_type_layout === 'classic') {
  $type_class = 'standart-post';
} elseif ($post_type_layout === 'medium') {
  $type_class = 'left-image-post';
} elseif ($post_type_layout === 'masonry') {
  $type_class = 'pheromone_mas_item';
}

// Sidebar layout
$sidebar_layout = get_theme_mod('pheromone_sidebars', 'sidebar-right');

// Blog Category Filter Nav terms
$terms = get_terms(array(
  'taxonomy'   => 'category',
  'hide_empty' => true,
  'orderby'    => 'name',
  'order'      => 'ASC',
));
?>

<section class="section-small">
  <div class="container">
    <div class="row">

      <?php if ($sidebar_layout === 'sidebar-left') : ?>

        <?php
          // IMPORTANT: do NOT wrap get_sidebar() in your own col div
          // because the theme sidebar.php likely includes its own column markup.
          get_sidebar();
        ?>

        <div class="col-lg-8 col-md-8 col-sm-12 sidebar-left">

          <header class="archive-header page-header">
            <h1 class="page-title"><?php echo esc_html(single_cat_title('', false)); ?></h1>

            <?php if (category_description()) : ?>
              <div class="taxonomy-description">
                <?php echo category_description(); ?>
              </div>
            <?php endif; ?>
          </header>

          <?php
          if (!is_wp_error($terms) && !empty($terms)) :
            echo '<nav class="vp-blog-filter-links text-center" aria-label="Blog categories">';
            echo '<ul class="vp-filter-list list-inline">';

            foreach ($terms as $t) {
              $is_current = ($current_term_id === (int) $t->term_id);
              $class = $is_current ? ' class="is-active"' : '';
              $url = get_term_link($t);

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

          <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>

              <?php
              $cats = get_the_category();
              $getAllCats = array();
              if (!empty($cats)) {
                foreach ($cats as $cat) {
                  $getAllCats[] = $cat->slug;
                }
              }

              $extra_classes = 'post-set ' . $type_class . (has_post_thumbnail() ? '' : ' no-thumbnail');
              ?>

              <article
                data-catslug-post="<?php echo esc_attr(implode(' ', $getAllCats)); ?>"
                id="post-<?php the_ID(); ?>"
                <?php post_class($extra_classes); ?>
              >

                <div class="post-thumbnail">
                  <?php if (has_post_thumbnail()) : ?>
                    <a href="<?php the_permalink(); ?>">
                      <?php the_post_thumbnail('large', array('class' => 'img-responsive')); ?>
                    </a>
                  <?php endif; ?>
                </div>

                <div class="content-block">
                  <h4 class="post-title">
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                  </h4>

                  <span class="post-date"><?php echo esc_html(get_the_date()); ?></span>

                  <div class="post-excerpt"><?php the_excerpt(); ?></div>

                  <div class="read-more-btn">
                    <a href="<?php the_permalink(); ?>" class="btn button btn-sm">
                      <?php esc_html_e('Read More', 'pheromone'); ?>
                    </a>
                  </div>
                </div>

              </article>

            <?php endwhile; ?>

            <?php
            the_posts_pagination(array(
              'prev_text' => esc_html__('&laquo;', 'pheromone'),
              'next_text' => esc_html__('&raquo;', 'pheromone'),
            ));
            ?>

          <?php else : ?>
            <p class="not-found"><?php esc_html_e('Sorry, no posts in this category.', 'pheromone'); ?></p>
          <?php endif; ?>

        </div>

      <?php elseif ($sidebar_layout === 'sidebar-right') : ?>

        <div class="col-lg-8 col-md-8 col-sm-12 sidebar-right">

          <header class="archive-header page-header">
            <h1 class="page-title"><?php echo esc_html(single_cat_title('', false)); ?></h1>

            <?php if (category_description()) : ?>
              <div class="taxonomy-description">
                <?php echo category_description(); ?>
              </div>
            <?php endif; ?>
          </header>

          <?php
          if (!is_wp_error($terms) && !empty($terms)) :
            echo '<nav class="vp-blog-filter-links text-center" aria-label="Blog categories">';
            echo '<ul class="vp-filter-list list-inline">';

            foreach ($terms as $t) {
              $is_current = ($current_term_id === (int) $t->term_id);
              $class = $is_current ? ' class="is-active"' : '';
              $url = get_term_link($t);

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

          <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>

              <?php
              $cats = get_the_category();
              $getAllCats = array();
              if (!empty($cats)) {
                foreach ($cats as $cat) {
                  $getAllCats[] = $cat->slug;
                }
              }

              $extra_classes = 'post-set ' . $type_class . (has_post_thumbnail() ? '' : ' no-thumbnail');
              ?>

              <article
                data-catslug-post="<?php echo esc_attr(implode(' ', $getAllCats)); ?>"
                id="post-<?php the_ID(); ?>"
                <?php post_class($extra_classes); ?>
              >

                <div class="post-thumbnail">
                  <?php if (has_post_thumbnail()) : ?>
                    <a href="<?php the_permalink(); ?>">
                      <?php the_post_thumbnail('large', array('class' => 'img-responsive')); ?>
                    </a>
                  <?php endif; ?>
                </div>

                <div class="content-block">
                  <h4 class="post-title">
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                  </h4>

                  <span class="post-date"><?php echo esc_html(get_the_date()); ?></span>

                  <div class="post-excerpt"><?php the_excerpt(); ?></div>

                  <div class="read-more-btn">
                    <a href="<?php the_permalink(); ?>" class="btn button btn-sm">
                      <?php esc_html_e('Read More', 'pheromone'); ?>
                    </a>
                  </div>
                </div>

              </article>

            <?php endwhile; ?>

            <?php
            the_posts_pagination(array(
              'prev_text' => esc_html__('&laquo;', 'pheromone'),
              'next_text' => esc_html__('&raquo;', 'pheromone'),
            ));
            ?>

          <?php else : ?>
            <p class="not-found"><?php esc_html_e('Sorry, no posts in this category.', 'pheromone'); ?></p>
          <?php endif; ?>

        </div>

        <?php
          // IMPORTANT: do NOT wrap get_sidebar() in your own col div
          get_sidebar();
        ?>

      <?php else : ?>

        <div class="col-lg-12 col-md-12 col-sm-12 no-sidebar">

          <header class="archive-header page-header">
            <h1 class="page-title"><?php echo esc_html(single_cat_title('', false)); ?></h1>

            <?php if (category_description()) : ?>
              <div class="taxonomy-description">
                <?php echo category_description(); ?>
              </div>
            <?php endif; ?>
          </header>

          <?php
          if (!is_wp_error($terms) && !empty($terms)) :
            echo '<nav class="vp-blog-filter-links text-center" aria-label="Blog categories">';
            echo '<ul class="vp-filter-list list-inline">';

            foreach ($terms as $t) {
              $is_current = ($current_term_id === (int) $t->term_id);
              $class = $is_current ? ' class="is-active"' : '';
              $url = get_term_link($t);

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

          <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>

              <?php
              $cats = get_the_category();
              $getAllCats = array();
              if (!empty($cats)) {
                foreach ($cats as $cat) {
                  $getAllCats[] = $cat->slug;
                }
              }

              $extra_classes = 'post-set ' . $type_class . (has_post_thumbnail() ? '' : ' no-thumbnail');
              ?>

              <article
                data-catslug-post="<?php echo esc_attr(implode(' ', $getAllCats)); ?>"
                id="post-<?php the_ID(); ?>"
                <?php post_class($extra_classes); ?>
              >

                <div class="post-thumbnail">
                  <?php if (has_post_thumbnail()) : ?>
                    <a href="<?php the_permalink(); ?>">
                      <?php the_post_thumbnail('large', array('class' => 'img-responsive')); ?>
                    </a>
                  <?php endif; ?>
                </div>

                <div class="content-block">
                  <h4 class="post-title">
                    <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                  </h4>

                  <span class="post-date"><?php echo esc_html(get_the_date()); ?></span>

                  <div class="post-excerpt"><?php the_excerpt(); ?></div>

                  <div class="read-more-btn">
                    <a href="<?php the_permalink(); ?>" class="btn button btn-sm">
                      <?php esc_html_e('Read More', 'pheromone'); ?>
                    </a>
                  </div>
                </div>

              </article>

            <?php endwhile; ?>

            <?php
            the_posts_pagination(array(
              'prev_text' => esc_html__('&laquo;', 'pheromone'),
              'next_text' => esc_html__('&raquo;', 'pheromone'),
            ));
            ?>

          <?php else : ?>
            <p class="not-found"><?php esc_html_e('Sorry, no posts in this category.', 'pheromone'); ?></p>
          <?php endif; ?>

        </div>

      <?php endif; ?>

    </div>
  </div>
</section>

<?php get_footer(); ?>