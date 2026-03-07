<?php
/**
 * Default Page Template (with featured-image hero header)
 * Renders a full-width page hero using the page's featured image + centered title.
 * Applies to standard pages only (excludes the front page).
 * Edit in: child theme page.php
 */

get_header();

if ( have_posts() ) :
  while ( have_posts() ) : the_post();

    // Exclude homepage: homepage uses front-page.php (but this keeps page.php safe if reused)
    $show_page_hero = ! is_front_page();

    $hero_style = '';
    if ( $show_page_hero && has_post_thumbnail() ) {
      $hero_url   = get_the_post_thumbnail_url( get_the_ID(), 'full' );
      $hero_style = $hero_url ? 'style="background-image: url(' . esc_url( $hero_url ) . ');"' : '';
    }
?>

  <?php if ( $show_page_hero ) : ?>
    <header class="vp-page-hero" <?php echo $hero_style; ?>>
      <div class="vp-page-hero__overlay"></div>
      <div class="container vp-page-hero__inner">
        <?php
        /**
         * Page Hero Title
         * Uses optional ACF field 'vp_hero_title' for styled headings.
         * Falls back to the normal WP title if empty.
         */
        $hero_title = function_exists('get_field') ? get_field('vp_hero_title') : '';
        ?>

        <h1 class="vp-page-hero__title mb-0">
          <?php
            if (!empty($hero_title)) {
              // Allow only very limited HTML (span + class) for styling
              echo wp_kses(
                $hero_title,
                [
                  'span' => ['class' => true],
                  'br'   => [],
                ]
              );
            } else {
              the_title();
            }
          ?>
        </h1>
      </div>
    </header>
  <?php endif; ?>

  <div class="vp-section">
    <div class="container-fluid">
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
  </div>

<?php
  endwhile;
endif;

get_footer();