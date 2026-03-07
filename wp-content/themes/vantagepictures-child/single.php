<?php
get_header();
?>

<div class="vp-single">
  <div class="container">
    <div class="vp-content-flow">
        <?php
          if (have_posts()) :
            while (have_posts()) : the_post();
              get_template_part('content', 'single');

              if (comments_open() || get_comments_number()) {
                comments_template();
              }
            endwhile;
          endif;
        ?>
      </div>
    </div>
  </div>
</div>

<?php
get_footer();