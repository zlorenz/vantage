<?php
/**
 * Home Hero Carousel (Bootstrap 5)
 * Slides are managed via an ACF Repeater on the Front Page.
 *
 * ACF fields (Front Page):
 * - slides (repeater)
 *   - portfolio_item (post object / post ID)  [required]
 *   - button_label (text)                    [optional; default "Watch"]
 *
 * Portfolio fields (on portfolio_item):
 * - header_title (text)  -> headline
 * - excerpt (native WP)  -> subheadline
 * - featured image       -> background
 */

$front_id = get_queried_object_id(); // front page ID

if (!function_exists('have_rows') || !have_rows('slides', $front_id)) {
  return;
}

// Build a normalized array so we can safely render indicators + slides.
$slides = [];
while (have_rows('slides', $front_id)) {
  the_row();

  $portfolio_id = get_sub_field('portfolio_item');
  if (empty($portfolio_id)) {
    continue;
  }

  // If ACF returns a WP_Post object, normalize to ID.
  if (is_object($portfolio_id) && !empty($portfolio_id->ID)) {
    $portfolio_id = (int) $portfolio_id->ID;
  } else {
    $portfolio_id = (int) $portfolio_id;
  }

  if ($portfolio_id <= 0) {
    continue;
  }

  $slides[] = [
    'id'          => $portfolio_id,
    'button_label'=> (string) (get_sub_field('button_label') ?: 'Watch'),
  ];
}

if (empty($slides)) {
  return;
}

$carousel_id = 'vpHomeCarousel';
?>

<section class="vp-hero-carousel">
  <div id="<?php echo esc_attr($carousel_id); ?>" class="carousel slide" data-bs-ride="carousel">

    <div class="carousel-indicators">
      <?php foreach ($slides as $i => $s): ?>
        <button
          type="button"
          data-bs-target="#<?php echo esc_attr($carousel_id); ?>"
          data-bs-slide-to="<?php echo (int) $i; ?>"
          class="<?php echo $i === 0 ? 'active' : ''; ?>"
          aria-current="<?php echo $i === 0 ? 'true' : 'false'; ?>"
          aria-label="<?php echo esc_attr('Slide ' . ($i + 1)); ?>">
        </button>
      <?php endforeach; ?>
    </div>

    <div class="carousel-inner">
      <?php foreach ($slides as $i => $s): ?>
        <?php
          $pid = $s['id'];

          $headline = get_field('header_title', $pid);
          $headline = $headline ? $headline : get_the_title($pid);

          $subheadline = get_the_excerpt($pid);

          $bg_url = get_the_post_thumbnail_url($pid, 'full');
          $permalink = get_permalink($pid);

          // Fallback if no featured image
          $bg_style = $bg_url ? "background-image:url('" . esc_url($bg_url) . "');" : '';
        ?>

        <div class="carousel-item <?php echo $i === 0 ? 'active' : ''; ?>">
          <div class="vp-hero-slide d-flex align-items-center" style="<?php echo esc_attr($bg_style); ?>">
            <div class="container">
              <div class="vp-hero-copy text-center text-white">
                <h1 class="mb-3">
                  <?php echo wp_kses_post($headline); ?>
                </h1>

                <?php if (!empty($subheadline)): ?>
                  <p class="lead mb-4">
                    <?php echo esc_html($subheadline); ?>
                  </p>
                <?php endif; ?>

                <a class="btn btn-outline-light btn-lg" href="<?php echo esc_url($permalink); ?>"><i class="fa fa-play" aria-hidden="true"></i>
                  <?php echo esc_html($s['button_label']); ?>
                </a>
              </div>
            </div>

            <!-- Optional overlay for readability -->
            <div class="vp-hero-overlay"></div>
          </div>
        </div>
      <?php endforeach; ?>
    </div>

    <button class="carousel-control-prev" type="button" data-bs-target="#<?php echo esc_attr($carousel_id); ?>" data-bs-slide="prev">
      <span class="carousel-control-prev-icon" aria-hidden="true"></span>
      <span class="visually-hidden"><?php esc_html_e('Previous', 'vantagepictures'); ?></span>
    </button>

    <button class="carousel-control-next" type="button" data-bs-target="#<?php echo esc_attr($carousel_id); ?>" data-bs-slide="next">
      <span class="carousel-control-next-icon" aria-hidden="true"></span>
      <span class="visually-hidden"><?php esc_html_e('Next', 'vantagepictures'); ?></span>
    </button>

  </div>
</section>