<?php
/**
 * Portfolio Card
 * template-parts/portfolio/card.php
 */
?>

<a class="vp-card d-block text-decoration-none" href="<?php the_permalink(); ?>">

  <div class="vp-card__media ratio ratio-16x9 bg-dark overflow-hidden">
    <?php if (has_post_thumbnail()) : ?>
      <?php
      // Use medium_large for cards; rely on ratio + object-fit for 16:9 crop.
      the_post_thumbnail('medium_large', [
        'class'   => 'w-100 h-100 object-fit-cover vp-card-img',
        'loading' => 'lazy',
        'sizes'   => '(max-width: 576px) 100vw, (max-width: 992px) 50vw, 33vw',
      ]);
      ?>
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