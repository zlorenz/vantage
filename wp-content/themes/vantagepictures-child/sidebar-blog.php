<?php
/**
 * Blog sidebar
 * Purpose: Categories for the News page (search lives in nav).
 */
?>

<aside class="vp-blog-sidebar">

  <div class="vp-blog-widget vp-blog-categories">
    <h3 class="vp-blog-widget__title">BLOG CATEGORIES</h3>
    <ul class="vp-blog-categories-list">
      <?php
      wp_list_categories([
        'orderby'    => 'name',
        'order'      => 'ASC',
        'title_li'   => '',
        'show_count' => false,
      ]);
      ?>
    </ul>
  </div>

</aside>