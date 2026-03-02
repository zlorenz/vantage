<?php get_header(); ?>
	<?php  if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
        <section class="section-small">
                <div class="container">
                    <div class="row">
                        <div class="col-md-12 col col-sm-12 no-sidebar">
                            <?php the_content(); ?>                        
                        </div>
                    </div>                          
                </div> 
            </section>
            <?php wc_get_template_part( 'loop/pagination' );  ?>
            <?php endwhile; endif; ?>                       
<?php get_footer(); ?>























