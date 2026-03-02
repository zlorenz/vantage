<?php if(get_theme_mod('pheromone_404_image', 'enable')) {?>
	<div class="tag_line tag_line_image" data-background="<?php echo esc_url(get_theme_mod('pheromone_404_image', get_template_directory_uri() . '/assets/images/0.jpg')); ?>">
<?php } else { ?>
    <div class="tag_line tag_line_image" data-background="<?php echo get_template_directory_uri() . '/assets/images/0.jpg' ?>">
<?php } ?>
    <div class="tag-body">
		<h1 class="classic"><span>404</span> Error</h1>
		<div class="container">
			<div class="row">
				<div class="col-md-6 col-md-offset-3">
					<h4 class="error-message"><?php echo esc_attr(get_theme_mod('pheromone_404_text_2', "It could be you, or it could be us, but there's no page here.")) ?></h4>
					<?php get_search_form(); ?>
            			<ul class="list-inline">
            				<li><a href="https://vimeo.com/vantagepictures" target="_blank"><i class="fa fa-vimeo fa-fw fa-2x"></i></a></li>
							<?php if(get_theme_mod('pheromone_fot_soc_twitter','enable') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_twitter','http://twitter.com'))) ?>" target="_blank"><i class="fa fa-twitter fa-fw fa-2x"></i></a></li><?php }; ?>
							<?php if(get_theme_mod('pheromone_fot_soc_instagram') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_instagram'))) ?>" target="_blank"><i class="fa fa-instagram fa-fw fa-2x"></i></a></li><?php }; ?>  
							<?php if(get_theme_mod('pheromone_fot_soc_facebook','enable') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_facebook','http://facebook.com'))) ?>" target="_blank"><i class="fa fa-facebook fa-fw fa-2x"></i></a></li><?php }; ?> 
							<?php if(get_theme_mod('pheromone_fot_soc_googleplus','enable') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_googleplus','http://plus.google.com'))) ?>" target="_blank"><i class="fa fa-google-plus fa-fw fa-2x"></i></a></li><?php }; ?> 
							<?php if(get_theme_mod('pheromone_fot_soc_linkedin','enable') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_linkedin','http://linkedin.com'))) ?>" target="_blank"><i class="fa fa-linkedin fa-fw fa-2x"></i></a></li><?php }; ?>
							<?php if(get_theme_mod('pheromone_fot_soc_youtube') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_youtube'))) ?>" target="_blank"><i class="fa fa-youtube-play fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_flickr') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_flickr'))) ?>" target="_blank"><i class="fa fa-flickr fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_tumblr') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_tumblr'))) ?>" target="_blank"><i class="fa fa-tumblr fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_foursquare') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_foursquare'))) ?>" target="_blank"><i class="fa fa-foursquare fa-fw fa-2x"></i></a></li><?php }; ?>  
							<?php if(get_theme_mod('pheromone_fot_soc_vk') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_vk'))) ?>" target="_blank"><i class="fa fa-vk fa-fw fa-2x"></i></a></li><?php }; ?>
							<?php if(get_theme_mod('pheromone_fot_soc_behance') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_behance'))) ?>" target="_blank"><i class="fa fa-behance fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_pinterest') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_pinterest'))) ?>" target="_blank"><i class="fa fa-pinterest fa-fw fa-2x"></i></a></li><?php }; ?>
							<?php if(get_theme_mod('pheromone_fot_soc_github') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_github'))) ?>" target="_blank"><i class="fa fa-github fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_rss') == true) {?><li><a href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_rss'))) ?>" target="_blank"><i class="fa fa-rss fa-fw fa-2x"></i></a></li><?php }; ?>   
		              	</ul>
		              	  <?php if(get_theme_mod('pheromone_404_copyright','enable') == true)  { ?>
							<p class="copy-info"><?php echo get_theme_mod( 'pheromone_404_copyright_text', wp_kses( __('Powered by <a href="https://themeforest.net/user/dankov" target="_blank">DankovThemes</a>', 'pheromone' ), array('a'=> array('href' => array())))); ?></p>
     					<?php }; ?>
     			</div>
			</div>
		</div>
  	</div>  	
</div>