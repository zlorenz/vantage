<?php // Template Name: Blog ?>
    <?php get_header(); $layout_value_index = get_theme_mod( 'pheromone_post_type' ); ?>
        <?php $layout_value = get_theme_mod( 'pheromone_sidebars', 'sidebar-right' ); ?>
            <?php if ($layout_value == 'sidebar-left'): ?>    
            <section class="section-small">
                <div class="container">
                    <div class="row">
                        <div class="col-md-8 col col-sm-12 sidebar-left">
                            <div class="row">
                                <div class="col-md-12 news-block-text">
                                    <div class="pull-left"><h4><?php esc_html_e('Our Latest News', 'pheromone' ) ?></h4></div>
                                </div>
                            </div>
                            <?php get_template_part( 'framework/content/content');?>
                        </div>
                        <?php get_sidebar(); ?>
                    </div>                
                </div>
                <?php the_posts_pagination( array('prev_text' => esc_html__('&laquo;','pheromone'), 'next_text'    => esc_html__('&raquo;','pheromone'))) ?>
            </section>
            <?php elseif ($layout_value == 'sidebar-right'): ?>    
            <section class="section-small">
                <div class="container">
                    <div class="row">
                        <div class="col-md-8 col col-sm-12 sidebar-right">
                            <div class="row">
                            <div class="col-md-12 news-block-text">
                                    <div class="pull-left"><h4><?php esc_html_e('Our Latest News', 'pheromone' ) ?></h4></div>
                                </div>
                            </div>
                            <?php get_template_part( 'framework/content/content');?>
                        </div>
                        <?php get_sidebar(); ?>
                    </div>
                </div>                          
                <?php the_posts_pagination( array('prev_text' => esc_html__('&laquo;','pheromone'), 'next_text'    => esc_html__('&raquo;','pheromone'))) ?>
            </section>
            <?php else: ?>
                <?php if ($layout_value_index == 'masonry') {?>
                    <section class="section-small">
                        <div class="container">
                            <div class="row">
                                <div class="col-lg-12 col-md-12 col-sm-12 no-sidebar">
                                    <div class="row">
                                        <div class="col-md-12 news-block-text">
                                            <div class="pull-left"><h4><?php esc_html_e('Our Latest News', 'pheromone' ) ?></h4></div>
                                        </div>
                                    </div>
                                    <?php get_template_part( 'framework/content/content');?>
                                </div> 
                            </div> 
                        </div>
                        <?php the_posts_pagination( array('prev_text' => esc_html__('&laquo;','pheromone'), 'next_text'    => esc_html__('&raquo;','pheromone'))) ?>
                    </section>
            <?php } else { ?>
            <section class="section-small">
                <div class="container">
                    <div class="row">
                        <div class="col-lg-12 col-md-12 col-sm-12 no-sidebar">
                            <div class="row">
                                <div class="col-md-12 news-block-text">
                                    <div class="pull-left"><h4><?php esc_html_e('Our Latest News', 'pheromone' ) ?></h4></div>
                                </div>
                            </div>
                            <?php get_template_part( 'framework/content/content');?>
                        </div> 
                    </div> 
                </div>
                <?php the_posts_pagination( array('prev_text' => esc_html__('&laquo;','pheromone'), 'next_text'    => esc_html__('&raquo;','pheromone'))) ?>
            </section>
        <?php } ?>
    <?php endif; ?>
<?php get_footer(); ?>