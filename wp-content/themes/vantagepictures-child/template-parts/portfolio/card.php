<?php
/**
 * Portfolio Card
 * template-parts/portfolio/card.php
 */
?>

<a class="vp-card d-block text-decoration-none" href="<?php the_permalink(); ?>">

  <div class="vp-card__media ratio ratio-16x9 bg-dark overflow-hidden">
    <?php if (has_post_thumbnail()) : ?>
      <?php the_post_thumbnail('large', [
        'class' => 'w-100 h-100 object-fit-cover',
        'loading' => 'lazy',
      ]); ?>
    <?php else : ?>
      <div class="d-flex align-items-center justify-content-center text-white-50">
        No Thumbnail
      </div>
    <?php endif; ?>

    <div class="vp-card__overlay"></div>

    <div class="vp-card__title">
      <?php echo wp_kses(vp_portfolio_thumb_title(), ['br' => []]); ?>
    </div>
  </div>

</a>