<?php
$layout_value = get_theme_mod('pheromone_post_type', 'classic');
?>

<?php if ($layout_value == 'masonry') : ?>
  <div class="wrap-content pheromone_mas_container">
<?php else : ?>
  <div class="wrap-content">
<?php endif; ?>

  <?php
  // Only show this intro on the main blog index (Posts page)
  if ( is_home() && ! is_paged() ) : ?>
    
    <div class="news-intro-block">
      <h2>News & Insights</h2>
      <p>Stay updated with the latest news, behind-the-scenes breakdowns, creative insights, and industry press from Vantage Pictures. Explore how our commercial film productions come to life — from concept development and cinematography to post-production, global campaigns, and cross-border collaboration.</p>
    </div>

  <?php endif; ?>

  <?php if ( ! have_posts() ) : ?>
    <h3 class="page_title"><?php esc_html_e('Nothing was found', 'pheromone'); ?></h3>
  <?php else : ?>
    <?php while ( have_posts() ) : the_post(); ?>
      <?php get_template_part('framework/content/post'); ?>
    <?php endwhile; ?>
  <?php endif; ?>


  <?php
  /**
   * JSON-LD for the News index (Posts page)
   * Outputs CollectionPage + ItemList of posts on the current paged view.
   * This is intentionally lean; each individual post page should output BlogPosting.
   */
  if ( is_home() ) :

    // Extra safety: confirm this "home" is actually your Posts page ID 8 (as you noted).
    // If you ever change Settings > Reading > Posts page, update this or remove the check.
    $posts_page_id = (int) get_option('page_for_posts');
    if ( $posts_page_id === 8 ) {

      global $wp_query;

      // Current blog index URL:
      // On many sites, this will be the permalink of page_for_posts (e.g. /news/).
      // Fallback to home_url('/') if not set for some reason.
      $page_url = $posts_page_id ? get_permalink($posts_page_id) : home_url('/');

      // Use Yoast-style IDs if you already output these elsewhere.
      $website_id = home_url('/#website');
      $org_id     = home_url('/#Organization');

      // Build ItemList from exactly what WP queried for this page.
      $items = [];
      $position = 1;

      if ( ! empty($wp_query->posts) ) {
        foreach ( $wp_query->posts as $p ) {
          $post_id = (int) $p->ID;

          $items[] = [
            '@type'    => 'ListItem',
            'position' => $position++,
            'url'      => get_permalink($post_id),
            'name'     => get_the_title($post_id),
            'datePublished' => get_the_date(DATE_W3C, $post_id),
          ];
        }
      }

      // Page title + description (match your intro copy, but keep it stable)
      $page_name = $posts_page_id ? get_the_title($posts_page_id) : 'News & Insights';
      $page_desc = 'Stay updated with the latest news, behind-the-scenes breakdowns, creative insights, and industry press from Vantage Pictures. Explore how our commercial film productions come to life — from concept development and cinematography to post-production, global campaigns, and cross-border collaboration.';

      $schema = [
        '@context' => 'https://schema.org',
        '@type'    => 'CollectionPage',
        '@id'      => trailingslashit($page_url) . '#news',
        'url'      => $page_url,
        'name'     => $page_name,
        'description' => $page_desc,
        'isPartOf' => [
          '@id' => $website_id,
        ],
        'publisher' => [
          '@id' => $org_id,
        ],
        'mainEntity' => [
          '@type'           => 'ItemList',
          'itemListOrder'   => 'https://schema.org/ItemListOrderDescending',
          'numberOfItems'   => count($items),
          'itemListElement' => $items,
        ],
      ];

      // Optional: add simple pagination signal
      $paged = max(1, (int) get_query_var('paged'));
      if ( $paged > 1 ) {
        $schema['pagination'] = 'Page ' . $paged;
      }

      echo '<script type="application/ld+json">' .
        wp_json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) .
      '</script>';
    }
  endif;
  ?>

</div>