<?php
/**
 * Blog sidebar
 * Purpose: Search and recent posts for the News page.
 */
?>

<aside class="vp-blog-sidebar">

  <div class="vp-blog-widget vp-blog-widget--search">
    <?php get_search_form(); ?>
  </div>

  <div class="vp-blog-widget">
    <h3 class="vp-blog-widget__title">RECENT POSTS</h3>

    <div class="vp-recent-posts">
      <?php
      $recent_posts = get_posts([
        'post_type'           => 'post',
        'posts_per_page'      => 6,
        'post_status'         => 'publish',
        'ignore_sticky_posts' => true,
      ]);

      if ($recent_posts) :
        foreach ($recent_posts as $recent_post) :
      ?>
        <article class="vp-recent-post">
          <a class="vp-recent-post__link" href="<?php echo esc_url(get_permalink($recent_post->ID)); ?>">
            <?php echo esc_html(get_the_title($recent_post->ID)); ?>
          </a>
          <div class="vp-recent-post__date">
            <?php echo esc_html(get_the_date('F j, Y', $recent_post->ID)); ?>
          </div>
        </article>
      <?php
        endforeach;
        wp_reset_postdata();
      endif;
      ?>
    </div>
  </div>

</aside>