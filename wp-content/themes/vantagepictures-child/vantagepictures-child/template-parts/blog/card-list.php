<?php
/**
 * Blog list card
 * Purpose: Renders one post in the News page archive list.
 */
?>

<article id="post-<?php the_ID(); ?>" <?php post_class('vp-post-card'); ?>>

  <?php if (has_post_thumbnail()) : ?>
    <a class="vp-post-card__thumb" href="<?php the_permalink(); ?>" aria-label="<?php echo esc_attr(get_the_title()); ?>">
      <?php the_post_thumbnail('large', ['class' => 'img-fluid']); ?>
    </a>
  <?php endif; ?>

  <div class="vp-post-card__body">
    <h2 class="vp-post-card__title">
      <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
    </h2>

    <div class="vp-post-card__meta">
      <?php echo esc_html(get_the_date('F j, Y')); ?>
    </div>

    <div class="vp-post-card__excerpt">
      <?php the_excerpt(); ?>
    </div>
  </div>

</article>