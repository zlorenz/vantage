<?php
/**
 * Single Portfolio Item
 * File: single-portfolio.php
 * Post type: portfolio
 */

get_header();

if (!function_exists('vp_portfolio_get')) {
  function vp_portfolio_get($key, $post_id = null) {
    $post_id = $post_id ?: get_the_ID();
    if (function_exists('get_field')) return get_field($key, $post_id);
    return get_post_meta($post_id, $key, true);
  }
}

if (!function_exists('vp_portfolio_header_title')) {
  function vp_portfolio_header_title($post_id = null) {
    $t = trim((string) vp_portfolio_get('header_title', $post_id));
    return $t !== '' ? $t : get_the_title($post_id ?: get_the_ID());
  }
}
if (!function_exists('vp_portfolio_long_title')) {
  function vp_portfolio_long_title($post_id = null) {
    $t = trim((string) vp_portfolio_get('long_title', $post_id));
    return $t !== '' ? $t : get_the_title($post_id ?: get_the_ID());
  }
}

$post_id = get_the_ID();

$desc = vp_portfolio_get('description', $post_id);        // textarea

$hero_bg = get_the_post_thumbnail_url($post_id, 'full');
$hero_style = $hero_bg ? 'style="background-image:url(' . esc_url($hero_bg) . ');"' : '';
?>

<?php while (have_posts()) : the_post(); ?>

  <header class="vp-page-hero" <?php echo $hero_style; ?>>
    <div class="vp-page-hero__overlay"></div>
    <div class="container vp-page-hero__inner">
      <h1 class="vp-page-hero__title mb-0">
        <?php
        $hero_title = vp_portfolio_header_title($post_id);

        echo wp_kses(
          $hero_title,
          [
            'span' => ['class' => true],
            'br'   => [],
          ]
        );
        ?>
      </h1>
    </div>
  </header>

  <!-- Main -->
  <section class="vp-section py-5">
    <div class="container-fluid">
      <div class="row g-4">

        <!-- Left: Title + Description + Credits -->
        <div class="col-12 offset-lg-1 col-lg-3 order-2 order-lg-1">
          <h2 class="mb-3">
            <?php
            echo wp_kses(
              vp_portfolio_long_title($post_id),
              [
                'span' => ['class' => true],
                'br'   => [],
              ]
            );
            ?></h2>

          <?php if (!empty($desc)) : ?>
            <div class="text-body-secondary mb-4">
              <?php echo wp_kses_post(wpautop($desc)); ?>
            </div>
          <?php endif; ?>

        </div>

        <!-- Right: Video embed (Vimeo default; Xinpianchang on /zh/ when set) -->
        <div class="col-12 col-lg-7 order-1 order-lg-2">
          <?php if ( function_exists( 'vp_portfolio_has_video_embed' ) && vp_portfolio_has_video_embed( $post_id ) ) : ?>
            <div class="ratio ratio-16x9 mb-3">
              <?php vp_portfolio_render_video_embed( $post_id ); ?>
            </div>
          <?php else : ?>
            <div class="bg-dark text-white-50 p-4 rounded">
              <?php esc_html_e( 'No video embed found for this portfolio item.', 'vantagepictures' ); ?>
            </div>
          <?php endif; ?>
        </div>

      </div>

      <?php if ( function_exists( 'vp_portfolio_render_credits' ) ) : ?>
        <div class="row mt-4">
          <div class="col-12 offset-lg-1 col-lg-10">
            <?php vp_portfolio_render_credits( $post_id ); ?>
          </div>
        </div>
      <?php endif; ?>
    </div>
  </section>

  <?php
  $additional = function_exists('get_field') ? get_field('additional_videos', $post_id) : null;
  if (!empty($additional) && is_array($additional)) :
    foreach ($additional as $idx => $row) :
      $av_vimeo       = isset($row['vimeo_link']) ? trim((string) $row['vimeo_link']) : '';
      $av_xinpianchang = isset($row['xinpianchang_link']) ? trim((string) $row['xinpianchang_link']) : '';
      $av_title       = isset($row['long_title']) ? trim((string) $row['long_title']) : '';
      $av_desc        = isset($row['description']) ? trim((string) $row['description']) : '';

      $av_has_embed = $av_vimeo !== '' || ( function_exists( 'vp_portfolio_is_chinese' ) && vp_portfolio_is_chinese() && function_exists( 'vp_xinpianchang_to_embed_url' ) && vp_xinpianchang_to_embed_url( $av_xinpianchang ) !== '' );
      if ( ! $av_has_embed ) continue;
  ?>
  <section class="vp-section py-5 border-top">
    <div class="container-fluid">
      <div class="row g-4">
        <div class="col-12 offset-lg-1 col-lg-3 order-2 order-lg-1">
          <?php if (!empty($av_title)) : ?>
            <h2 class="mb-3">
              <?php echo wp_kses($av_title, ['span' => ['class' => true], 'br' => [], 'div' => ['class' => true]]); ?>
            </h2>
          <?php endif; ?>
          <?php if (!empty($av_desc)) : ?>
            <div class="text-body-secondary mb-4">
              <?php echo wp_kses_post(wpautop($av_desc)); ?>
            </div>
          <?php endif; ?>
        </div>
        <div class="col-12 col-lg-7 order-1 order-lg-2">
          <div class="ratio ratio-16x9 mb-3">
            <?php
              if ( function_exists( 'vp_portfolio_render_video_embed_content' ) ) {
                vp_portfolio_render_video_embed_content( $av_vimeo, $av_xinpianchang );
              } else {
                echo '<div class="bg-dark text-white-50 p-4 rounded">Invalid video link.</div>';
              }
            ?>
          </div>
        </div>
      </div>
    </div>
  </section>
  <?php
    endforeach;
  endif;
  ?>

<?php endwhile; ?>

<?php get_footer(); ?>