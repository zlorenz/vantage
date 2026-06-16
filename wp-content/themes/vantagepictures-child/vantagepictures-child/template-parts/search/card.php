<?php
/**
 * Search result card
 * Purpose: Renders one search result in the custom search results grid.
 */

$post_type = get_post_type();

switch ($post_type) {
  case 'portfolio':
    $post_type_label = 'Portfolio';
    break;
  case 'post':
    $post_type_label = 'News';
    break;
  case 'page':
    $post_type_label = 'Page';
    break;
  default:
    $post_type_label = ucfirst($post_type);
}
?>

<a href="<?php the_permalink(); ?>" class="vp-search-card">

  <?php if (has_post_thumbnail()) : ?>
    <div class="vp-search-card__thumb">
      <?php the_post_thumbnail('large', ['class' => 'img-fluid']); ?>
    </div>
  <?php endif; ?>

  <div class="vp-search-card__body">

    <div class="vp-search-card__meta">
      <?php echo esc_html($post_type_label); ?>

      <?php if ($post_type === 'post') : ?>
        <span class="vp-search-card__meta-sep">•</span>
        <?php echo esc_html(get_the_date('F j, Y')); ?>
      <?php endif; ?>
    </div>

    <h2 class="vp-search-card__title">
      <?php the_title(); ?>
    </h2>

    <div class="vp-search-card__excerpt">
      <?php
      if (has_excerpt()) {
        the_excerpt();
      } else {
        echo '<p>' . esc_html(wp_trim_words(wp_strip_all_tags(get_the_content()), 24, '...')) . '</p>';
      }
      ?>
    </div>

  </div>

</a>