<?php if ( ! defined( 'ABSPATH' ) ) exit; // Exit if accessed directly ?>
<?php global $post; $large_image_url = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID ), 'full'); $image = wp_get_attachment_image_src( get_post_thumbnail_id( $post->ID  ), 'wall-portfolio-squre'); ?>

<?php get_header(); ?>
    <?php if(get_theme_mod('pheromone_single_portfolio_image', 'enable')) {?>
		<div class="tag_line tag_line_image portfolio" data-background="<?php echo esc_url(get_theme_mod('pheromone_single_portfolio_image', get_template_directory_uri() . '/assets/images/22.jpg')); ?>">
    <?php } else { ?>
      <div class="tag_line tag_line_image portfolio" data-background="<?php echo esc_url($image[0]); ?>">
    <?php } ?>
		    <div class="tag-body">
		        <div class="container">
		            <div class="row">
		                <div class="col-lg-12 col-md-12 col-sm-12 col-xs-12">
						    <?php if(get_theme_mod('pheromone_title_portfolio')) {?>
								<h4 class="tag_line_title"><?php echo get_theme_mod( 'pheromone_title_portfolio', 'Portfolio'); ?></h4>
						    <?php } else { ?>
						      	<h4 class="tag_line_title"><?php the_field('header_title'); ?></h4>
						    <?php } ?>
							<?php if(get_theme_mod('pheromone_breadcrumbs','enable') == true)  { ?><div class="breadcrumbs"><span class="folio-subtitle"><?php echo the_excerpt(); ?></span></div>
							<?php }; ?>
		                </div>
		            </div>
		        </div>
		    </div>
		</div>
<div class="content">
	<div class="container">
		<div class="row">
			<?php if ( have_posts() ) : while ( have_posts() ) : the_post(); ?>
				<div class="wrap-content">  
					<?php if(get_theme_mod('pheromone_single_portfolio_vc') == true)  { ?>
		            <div class="col-md-12 col-sm-12 col-xs-12">
		            	<?php the_content();?>
		            </div>
					<?php } else { ?>  
	            	<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
				       	<h3><?php the_title() ?></h3>
						<?php the_content();?>
						<?php if(get_theme_mod('pheromone_additional','enable') == true)  { ?>
						<hr>
						<ul class="single-portfolio-list">
				      		<?php if (get_post_meta($post->ID, 'port-client', true) == true) { ?><li><h6><i class="fa fa-user fa-fw"></i> <?php esc_html_e('Client', 'pheromone'); ?>: <?php echo esc_attr(get_post_meta($post->ID, 'port-client', true)); ?></h6></li><?php } ?>
				      		<?php if (get_post_meta($post->ID, 'port-date', true) == true) { ?><li><h6><i class="fa fa-calendar fa-fw"></i> <?php esc_html_e('Date', 'pheromone'); ?>: <?php echo esc_attr(get_post_meta($post->ID, 'port-date', true)); ?></h6></li><?php } ?>
				      		<?php if (get_post_meta($post->ID, 'port-service', true) == true) { ?><li><h6><i class="fa fa-desktop fa-fw"></i> <?php esc_html_e('Service', 'pheromone'); ?>: <?php echo get_post_meta($post->ID, 'port-service', 1)?></h6></li><?php } ?>
						</ul>
   	 					<?php } ?>
					</div>
	            	<div class="col-lg-6 col-md-6 col-sm-12 col-xs-12">
						<?php if (get_post_meta($post->ID, 'port-video', true) == true) {?>
							<?php echo get_post_meta($post->ID, 'port-video', true) ?>
						<?php } else {?>
	            			<div class="portfolio-single-img"><img src="<?php echo esc_url($large_image_url[0]); ?>" alt=""></div>
	            		<?php }?>
					</div>
					<?php }; ?>
				</div>
			<?php endwhile; endif;?>
		</div>
	</div>
	<!--<div class="pagination-line">
		<div class="container">
			<div class="row">
				<div class="col-lg-8 col-lg-offset-2">
					<ul class="pager">
						<li class="previous"> <?php previous_post_link( '%link', '<i class="fa fa-angle-left"></i> ' . __( 'Previous', 'pheromone' ) ); ?> </li>
						<li class="next"> <?php next_post_link( '%link',  __( 'Next', 'pheromone' ) . ' <i class="fa fa-angle-right"></i>'); ?> </li>
					</ul>
				</div>
			</div>
		</div>
	</div>-->
</div>
<?php get_footer(); ?>
