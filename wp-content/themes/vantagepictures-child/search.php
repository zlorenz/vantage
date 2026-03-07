<?php
/**
 * Search results template
 * Purpose: Custom search results page matching the Vantage site style.
 */

get_header();

$search_query = get_search_query();
?>

<header class="vp-search-header">
  <div class="container">
    <h2 class="mb-0">
      <span class="vp-outline">Search Results for:</span> <?php echo esc_html($search_query); ?>
    </h2>
  </div>
</header>

<section class="vp-search-page vp-section">
  <div class="container">

    <?php if (have_posts()) : ?>
      <div class="vp-search-results-grid">
        <?php while (have_posts()) : the_post(); ?>
          <?php get_template_part('template-parts/search/card'); ?>
        <?php endwhile; ?>
      </div>

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
      <div class="vp-search-empty">
        <h2 class="vp-search-empty__title">No results found</h2>
        <p>Try a different keyword or browse our work and news pages instead.</p>

        <div class="vp-search-empty__form">
          <?php get_search_form(); ?>
        </div>
      </div>
    <?php endif; ?>

  </div>
</section>

<?php get_footer(); ?>