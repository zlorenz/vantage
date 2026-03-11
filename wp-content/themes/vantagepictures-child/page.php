<?php
/**
 * Default Page Template (with optional featured-image hero header)
 * Hero visibility is controlled by ACF "Show hero header" (vp_show_hero_header) on the page.
 * When on: full-width hero with featured image background (e.g. About).
 * When off: condensed header, no background image (e.g. portfolio taxonomy style).
 * Applies to standard pages only (excludes the front page).
 * Edit in: child theme page.php
 */

get_header();

if ( have_posts() ) :
  while ( have_posts() ) : the_post();

    // Exclude homepage: homepage uses front-page.php (but this keeps page.php safe if reused)
    $is_page_edit = ! is_front_page();

    // ACF: Show hero header (default true for backward compatibility).
    $show_hero = $is_page_edit;
    if ( $is_page_edit && function_exists( 'get_field' ) ) {
      $hero_setting = get_field( 'vp_show_hero_header' );
      if ( $hero_setting === false || $hero_setting === 0 || $hero_setting === '0' ) {
        $show_hero = false;
      }
    }

    $hero_style = '';
    if ( $show_hero && has_post_thumbnail() ) {
      $hero_url   = get_the_post_thumbnail_url( get_the_ID(), 'full' );
      $hero_style = $hero_url ? 'style="background-image: url(' . esc_url( $hero_url ) . ');"' : '';
    }

    $hero_title = function_exists( 'get_field' ) ? get_field( 'vp_hero_title' ) : '';
?>

  <?php if ( $show_hero ) : ?>
    <header class="vp-page-hero" <?php echo $hero_style; ?>>
      <div class="vp-page-hero__overlay"></div>
      <div class="container vp-page-hero__inner">
        <h1 class="vp-page-hero__title mb-0">
          <?php
            if ( ! empty( $hero_title ) ) {
              echo wp_kses(
                $hero_title,
                array(
                  'span' => array( 'class' => true ),
                  'br'   => array(),
                )
              );
            } else {
              the_title();
            }
          ?>
        </h1>
      </div>
    </header>
  <?php elseif ( $is_page_edit ) : ?>
    <section class="vp-section vp-page-header-condensed">
      <div class="container">
        <header class="vp-page-hero__title mb-0 text-center">
          <h1><?php the_title(); ?></h1>
        </header>
      </div>
    </section>
  <?php endif; ?>

  <div class="vp-wrapper">
    <div class="vp-content-flow">
      <?php the_content(); ?>
    </div>

    <?php
      wp_link_pages([
        'before' => '<nav class="page-links mt-4" aria-label="' . esc_attr__('Page', 'vantagepictures') . '">',
        'after'  => '</nav>',
      ]);
    ?>
  </div>

<?php
  endwhile;
endif;

get_footer();