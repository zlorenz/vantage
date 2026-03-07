<?php
/**
 * Blog index / Posts page template
 * Purpose: Custom News & Insights page layout for the assigned Posts page,
 * using the shared page hero component from the default page template.
 */

get_header();

$page_id      = (int) get_option('page_for_posts');
$page_content = $page_id ? get_post_field('post_content', $page_id) : '';
?>

<?php if ($page_id) : ?>
  <?php
  $hero_style = '';
  if (has_post_thumbnail($page_id)) {
    $hero_url   = get_the_post_thumbnail_url($page_id, 'full');
    $hero_style = $hero_url ? 'style="background-image: url(' . esc_url($hero_url) . ');"' : '';
  }

  /**
   * Page Hero Title
   * Uses optional ACF field 'vp_hero_title' for styled headings.
   * Falls back to the normal WP title if empty.
   */
  $hero_title = function_exists('get_field') ? get_field('vp_hero_title', $page_id) : '';
  ?>
  <header class="vp-page-hero" <?php echo $hero_style; ?>>
    <div class="vp-page-hero__overlay"></div>
    <div class="container vp-page-hero__inner">
      <h1 class="vp-page-hero__title mb-0">
        <?php
        if (!empty($hero_title)) {
          echo wp_kses(
            $hero_title,
            [
              'span' => ['class' => true],
              'br'   => [],
            ]
          );
        } else {
          echo esc_html(get_the_title($page_id));
        }
        ?>
      </h1>
    </div>
  </header>
<?php endif; ?>

<section class="vp-news-page vp-section">
  <div class="container">
    <div class="row g-5">

      <div class="col-lg-8">
        <div class="vp-news-intro">
          <?php if (!empty($page_content)) : ?>
            <div class="vp-news-intro-copy">
              <?php echo apply_filters('the_content', $page_content); ?>
            </div>
          <?php else : ?>
            <div class="vp-news-intro-copy">
              <p>Stay updated with the latest news, behind-the-scenes breakdowns, creative insights, and industry press from Vantage Pictures. Explore how our commercial film productions come to life - from concept development and cinematography to post-production, global campaigns, and cross-border collaboration.</p>
            </div>
          <?php endif; ?>
        </div>

        <div class="vp-news-posts">
          <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
              <?php get_template_part('template-parts/blog/card', 'list'); ?>
            <?php endwhile; ?>

            <nav class="vp-pagination">
              <?php
              the_posts_pagination([
                'mid_size'  => 1,
                'prev_text' => '&laquo;',
                'next_text' => '&raquo;',
              ]);
              ?>
            </nav>
          <?php else : ?>
            <article class="vp-post-card">
              <h2 class="vp-post-card__title">Nothing found</h2>
              <p>No posts are available yet.</p>
            </article>
          <?php endif; ?>
        </div>
      </div>

      <div class="col-lg-4">
        <?php get_sidebar('blog'); ?>
      </div>

    </div>
  </div>
</section>

<?php get_footer(); ?>