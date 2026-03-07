<?php
/**
 * Child Theme: Fallback Index
 * Purpose: Provides a sane WordPress fallback template so the parent theme's
 * special "Blog Index" index.php doesn't get used as the universal fallback.
 */

get_header();
?>

<div class="container vp-section">
  <div class="row">
    <div class="col-12">
      <?php if (have_posts()) : ?>
        <?php while (have_posts()) : the_post(); ?>
          <?php get_template_part('content', get_post_format()); ?>
        <?php endwhile; ?>

        <?php the_posts_pagination(); ?>
      <?php else : ?>
        <?php get_template_part('content', 'none'); ?>
      <?php endif; ?>
    </div>
  </div>
</div>

<?php
get_footer();