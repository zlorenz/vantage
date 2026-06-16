<?php
/**
 * Shared blog archive layout: card list + sidebar, infinite scroll.
 * Used by archive.php and category.php. Output is identical to the previous
 * inline markup so front-end appearance is unchanged.
 *
 * Expected vars (passed via get_template_part $args):
 * - $archive_title     (string) Title HTML or escaped text for <h1>
 * - $archive_description (string) Optional description HTML, can be empty
 * - $empty_message     (string) Message when no posts, e.g. "No posts found."
 * - $sentinel_extra_attrs (array) Optional data attributes for load-more sentinel, e.g. ['data-category-id' => 5]
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$archive_title         = isset( $archive_title ) ? $archive_title : '';
$archive_description   = isset( $archive_description ) ? $archive_description : '';
$empty_message         = isset( $empty_message ) ? $empty_message : __( 'No posts found.', 'vantagepictures' );
$sentinel_extra_attrs  = isset( $sentinel_extra_attrs ) && is_array( $sentinel_extra_attrs ) ? $sentinel_extra_attrs : [];
?>

<section class="vp-blog-archive vp-section">
  <div class="container">
    <div class="row g-5">

      <div class="col-lg-8">
        <header class="mb-4 text-center">
          <h1 class="h2 mb-2"><?php echo $archive_title; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- may contain archive HTML ?></h1>
          <?php if ( $archive_description !== '' ) : ?>
            <div class="vp-intro text-body-secondary mx-auto" style="max-width: 900px;">
              <?php echo $archive_description; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- description HTML from theme/context ?>
            </div>
          <?php endif; ?>
        </header>

        <div class="vp-news-posts">
          <?php if ( have_posts() ) : ?>
            <div id="vp-blog-grid">
              <?php while ( have_posts() ) : the_post(); ?>
                <?php get_template_part( 'template-parts/blog/card', 'list' ); ?>
              <?php endwhile; ?>
            </div>
            <div id="vp-blog-load-more" class="vp-load-more-sentinel" data-offset="9" data-per-page="5" aria-hidden="true"<?php
              foreach ( $sentinel_extra_attrs as $attr_name => $attr_value ) {
                echo ' ' . esc_attr( $attr_name ) . '="' . esc_attr( $attr_value ) . '"';
              }
            ?>></div>
          <?php else : ?>
            <article class="vp-post-card">
              <h2 class="vp-post-card__title"><?php esc_html_e( 'Nothing found', 'vantagepictures' ); ?></h2>
              <p><?php echo esc_html( $empty_message ); ?></p>
            </article>
          <?php endif; ?>
        </div>
      </div>

      <div class="col-lg-4">
        <?php get_sidebar( 'blog' ); ?>
      </div>

    </div>
  </div>
</section>
