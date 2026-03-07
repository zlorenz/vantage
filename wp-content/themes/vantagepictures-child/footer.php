  </main><!-- /#main -->

  <footer id="footer" class="py-4">
    <div class="container">
      <div class="row align-items-center">
        <div class="col-md-6">
          <p class="mb-0">
            <?php printf(esc_html__('© %1$s %2$s. All rights reserved.', 'vantagepictures'), wp_date('Y'), get_bloginfo('name', 'display')); ?>
          </p>
        </div>

        <?php if (has_nav_menu('footer-menu')) : ?>
          <?php
            wp_nav_menu([
              'container'       => 'nav',
              'container_class' => 'col-md-6',
              'walker'          => new WP_Bootstrap4_Navwalker_Footer(),
              'theme_location'  => 'footer-menu',
              'items_wrap'      => '<ul class="menu nav justify-content-end">%3$s</ul>',
            ]);
          ?>
        <?php endif; ?>

        <?php if (is_active_sidebar('third_widget_area')) : ?>
          <div class="col-12 mt-3">
            <?php dynamic_sidebar('third_widget_area'); ?>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </footer>

</div><!-- /#wrapper -->

<?php wp_footer(); ?>
</body>
</html>