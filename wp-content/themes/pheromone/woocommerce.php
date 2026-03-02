<?php get_header(); ?>
    <?php $layout_value = get_theme_mod( 'pheromone_woo_sidebars', 'sidebar-no' ); ?>
        <?php if ($layout_value == 'sidebar-left'): ?>    
            <section class="section-small">
                <div class="container">
                    <div class="row">
                        <div class="col-md-8 col col-sm-12 sidebar-left">
                            <?php woocommerce_content(); ?>                        
                       </div>
                        <?php get_template_part( 'woocommerce/woo-sidebar');?>
                    </div>                
                </div>
            </section>
            <?php wc_get_template_part( 'loop/pagination' );  ?>                        
        <?php elseif ($layout_value == 'sidebar-right'): ?>    
            <section class="section-small">
                <div class="container">
                    <div class="row">
                        <div class="col-md-8 col col-sm-12 sidebar-right">
                            <?php woocommerce_content(); ?>                        
                       </div>
                        <?php get_template_part( 'woocommerce/woo-sidebar');?>
                    </div>                          
            </section>
            <?php wc_get_template_part( 'loop/pagination' );  ?>                        
        <?php elseif ($layout_value == 'sidebar-no'): ?>    
            <section class="section-small">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12 col col-sm-12 no-sidebar">
                            <?php woocommerce_content(); ?>                        
                        </div>
                    </div>                          
                </div> 
                <?php wc_get_template_part( 'loop/pagination' );  ?>                        
            </section>
        <?php endif; ?>
<?php get_footer(); ?>
















