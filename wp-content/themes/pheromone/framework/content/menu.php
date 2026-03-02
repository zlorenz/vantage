  <nav class="navbar navbar-wrap navbar-custom navbar-fixed-top menu-wrap">
    <div class="container full">
        <div class="row">
          <div class="col-lg-3 col-md-4 col-sm-6 col-xs-6">
              <div class="logo">
                <a href="<?php echo esc_url(home_url('/')); ?>" title="<?php bloginfo( 'name' ); ?>"><img src="<?php echo esc_url(get_theme_mod('pheromone_logo_upload', get_template_directory_uri() . '/assets/images/logo.png')); ?>" style="height: <?php echo esc_attr(get_theme_mod('pheromone_logo_height', '22px')); ?>" class="logowhite" alt="<?php the_title_attribute(); ?>" >
                  <img src="<?php echo esc_url(get_theme_mod('pheromone_logo_dark_upload', get_template_directory_uri() . '/assets/images/logo-dark.png')); ?>" style="height: <?php echo esc_attr(get_theme_mod('pheromone_logo_height', '22px')); ?>" class="logodark" alt="<?php the_title_attribute(); ?>" >
                </a>
              </div>
          </div>
          <div class="col-lg-9 col-md-8 col-sm-6 col-xs-6 pull-right">
          <?php if(get_theme_mod('pheromone_menu_select', 'standard') == 'standard')  { ?> 
            <div class="menu-center">
              <div class="menu-responsive desktop">
                <div class="collapse navbar-collapse navbar-main-collapse pull-left responsive-menu">
                        <?php wp_nav_menu( array(
                          'theme_location' => 'menu',
                          'container' => false,
                          'menu_class' => 'nav navbar-nav',
                          'sort_column' => 'menu_order',
                          'walker' => new Pheromone_My_Walker_Nav_Menu(),
                          'fallback_cb' => 'pheromone_MenuFallback'
                        )); ?> 
                </div>
              </div>
              <div class="menu-responsive mobile">
                <div class="burger_pheromone_normal_holder"><a href="#" class="nav-icon3" id="open-button"><span></span><span></span><span></span><span></span><span></span><span></span></a></div>
                  <div class="burger_pheromone_menu_overlay_normal">
                    <div class="burger_pheromone_menu_vertical">
                      <?php wp_nav_menu( array(
                        'theme_location' => 'menu',
                        'menu_class' => 'burger_pheromone_main_menu',
                        'depth' => 2,
                      )); ?>
                    </div>
                  </div>
              </div>
          </div>
          <?php } else { ?>
            <div class="menu-center">
              <div class="menu-responsive desktop">
                <div class="collapse navbar-collapse navbar-main-collapse pull-left responsive-menu">
                        <?php wp_nav_menu( array(
                          'theme_location' => 'onepage-menu',
                          'container' => false,
                          'menu_class' => 'nav navbar-nav share-class',
                          'menu_id' => 'menu-onepage',
                          'sort_column' => 'menu_order',
                          'walker' => new Pheromone_My_Walker_Nav_Menu(),
                          'fallback_cb' => 'pheromone_MenuFallback'
                        )); ?> 
                </div>
              </div>
              <div class="menu-responsive mobile">
                <div class="burger_pheromone_normal_holder"><a href="#" class="nav-icon3" id="open-button"><span></span><span></span><span></span><span></span><span></span><span></span></a></div>
                  <div class="burger_pheromone_menu_overlay_normal">
                    <div class="burger_pheromone_menu_vertical">
                      <?php wp_nav_menu( array(
                        'theme_location' => 'onepage-menu',
                        'menu_class' => 'burger_pheromone_main_menu share-class',
                        'depth' => 2,
                      )); ?>
                    </div>
                  </div>
              </div>
          </div>
          <?php } ?>
        </div> 
        </div> 
      </div>
      </nav>