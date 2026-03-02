<footer>
	<div class="footer">
		<?php if(get_theme_mod('pheromone_widget_footer') == true)  { ?>
		<div class="footer-area-cont">
			<div class="container">
				<div class="row">
				  <?php $pheromone_widget_footer_count = get_theme_mod( 'pheromone_widget_footer_count', 'three'); ?>
				    <?php if ($pheromone_widget_footer_count == 'three'): ?>
				    	<?php if ( is_active_sidebar('footer-1') || is_active_sidebar('footer-2') || is_active_sidebar('footer-3')) { ?>
						<div class="col-md-4 col-sm-6 col-xs-12">
							<div class="footer-widget footer-1">
								<div class="footer-area">
									<?php dynamic_sidebar( 'footer-1' ); ?>
								</div>
							</div>
						</div>
						<div class="col-md-4 hidden-xs">
							<div class="footer-widget footer-2">
								<div class="footer-area">
									<?php dynamic_sidebar( 'footer-2' ); ?>
								</div>
							</div>
						</div>
						<div class="col-md-4 col-sm-6 col-xs-12">
							<div class="footer-widget footer-3">
								<div class="footer-area">
									<?php dynamic_sidebar( 'footer-3' ); ?>
								</div>
							</div>
						</div>
						<?php } ?>
     				<?php elseif ($pheromone_widget_footer_count == 'four'): ?>
     					<?php if ( is_active_sidebar('footer-1') || is_active_sidebar('footer-2') || is_active_sidebar('footer-3') || is_active_sidebar('footer-4')) { ?>
							<div class="col-sm-4 col-xs-12">
								<div class="footer-widget">
									<div class="footer-area">
										<?php dynamic_sidebar( 'footer-1' ); ?>
									</div>
								</div>
							</div>
							<div class="col-sm-2 col-sm-offset-1 col-xs-12">
								<div class="footer-widget">
									<div class="footer-area">
										<?php dynamic_sidebar( 'footer-2' ); ?>
									</div>
								</div>
							</div>
							<div class="col-sm-2 col-xs-12">
								<div class="footer-widget">
									<div class="footer-area">
										<?php dynamic_sidebar( 'footer-3' ); ?>
									</div>
								</div>
							</div>
							<div class="col-sm-3 col-xs-12 text-right">
								<div class="footer-widget">
									<div class="footer-area">
										<?php dynamic_sidebar( 'footer-4' ); ?>
									</div>
								</div>
							</div>
						<?php } ?>
     				<?php elseif ($pheromone_widget_footer_count == 'five'): ?>
     					<?php if ( is_active_sidebar('footer-1') || is_active_sidebar('footer-2') || is_active_sidebar('footer-3') || is_active_sidebar('footer-4')) { ?>
							<div class="col-lg-3 col-md-3 col-sm-3 col-xs-12">
								<div class="footer-widget">
									<div class="footer-area">
										<?php dynamic_sidebar( 'footer-1' ); ?>
									</div>
								</div>
							</div>
							<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12">
								<div class="footer-widget">
									<div class="footer-area">
										<?php dynamic_sidebar( 'footer-2' ); ?>
									</div>
								</div>
							</div>
							<div class="col-lg-3 col-md-3 col-sm-6 col-xs-12">
								<div class="footer-widget">
									<div class="footer-area">
										<?php dynamic_sidebar( 'footer-3' ); ?>
									</div>
								</div>
							</div>
						<?php } ?>
     				<?php endif; ?> 
				</div>
			</div>
		</div>
		<?php }; ?> 
		<?php if(get_theme_mod('pheromone_author_footer', 'enable') == true)  { ?>
			<?php if(get_theme_mod('pheromone_author_footer_color', 'gray') == 'gray')  { ?>
				<div class="footer-copyright grey">
					<?php } else { ?>	
				<div class="footer-copyright white">
     		<?php }; ?> 
			<div class="container">
				<div class="row">
					<?php $pheromone_widget_footer_2_count = get_theme_mod( 'pheromone_widget_footer_2_count', 'three'); ?>
				    <?php if ($pheromone_widget_footer_2_count == 'three'): ?>
					<div class="col-sm-4 three-block">
						<div class="copyright-info text-left">
							<p><?php echo get_theme_mod( 'pheromone_footer_copy_1', wp_kses( __('Theme by <a href="https://themeforest.net/user/dankovthemes" target="_blank">DankovThemes</a>', 'pheromone'), array('a'=> array('href' => array(),'target' => array())))); ?></p>
						</div>
					</div>
					<div class="col-md-3 col-md-offset-1 three-block">
						<div class="love-info">
							<p><?php echo get_theme_mod( 'pheromone_footer_love', wp_kses( __('We <i class="fa fa-heart fa-fw"></i> Creative People', 'pheromone'), array('i'=> array('class' => array())))); ?></p>
						</div>
					</div>

					<div class="col-sm-3 col-sm-offset-1 text-right three-block">
            			<ul class="list-inline text-right">
		                  	<?php if(get_theme_mod('pheromone_fot_soc_twitter','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_twitter','http://twitter.com'))) ?>"><i class="fa fa-twitter fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_facebook','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_facebook','http://facebook.com'))) ?>"><i class="fa fa-facebook fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_googleplus','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_googleplus','http://plus.google.com'))) ?>"><i class="fa fa-google-plus fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_linkedin','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_linkedin','http://linkedin.com'))) ?>"><i class="fa fa-linkedin fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_dribbble') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_dribbble'))) ?>"><i class="fa fa-dribbble fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_instagram') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_instagram'))) ?>"><i class="fa fa-instagram fa-fw"></i></a></li><?php }; ?> 
							<?php if(get_theme_mod('pheromone_fot_soc_youtube') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_youtube'))) ?>"><i class="fa fa-youtube-play fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_flickr') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_flickr'))) ?>"><i class="fa fa-flickr fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_tumblr') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_tumblr'))) ?>"><i class="fa fa-tumblr fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_foursquare') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_foursquare'))) ?>"><i class="fa fa-foursquare fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_vk') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_vk'))) ?>"><i class="fa fa-vk fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_behance') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_behance'))) ?>"><i class="fa fa-behance fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_pinterest') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_pinterest'))) ?>"><i class="fa fa-pinterest fa-fw"></i></a></li><?php }; ?>
							<?php if(get_theme_mod('pheromone_fot_soc_github') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_github'))) ?>"><i class="fa fa-github fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_rss') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_rss'))) ?>"><i class="fa fa-rss fa-fw"></i></a></li><?php }; ?>   
		              </ul>
              		</div>
     				<?php elseif ($pheromone_widget_footer_2_count == 'two'): ?>
					<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12 two-block">
						<div class="copyright-info text-right">
							<p><?php echo get_theme_mod( 'pheromone_footer_copy_2', wp_kses( __('Powered by <a href="https://themeforest.net/user/dankovthemes" target="_blank">DankovThemes</a>', 'pheromone'), array('a'=> array('href' => array(),'target' => array())))); ?></p>
						</div>
					</div>
					<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12 two-block">
            			<ul class="list-inline text-left">
		                  	<?php if(get_theme_mod('pheromone_fot_soc_twitter','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_twitter','http://twitter.com'))) ?>"><i class="fa fa-twitter fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_facebook','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_facebook','http://facebook.com'))) ?>"><i class="fa fa-facebook fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_googleplus','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_googleplus','http://plus.google.com'))) ?>"><i class="fa fa-google-plus fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_linkedin','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_linkedin','http://linkedin.com'))) ?>"><i class="fa fa-linkedin fa-fw"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_dribbble') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_dribbble'))) ?>"><i class="fa fa-dribbble fa-fw"></i></a></li><?php }; ?> 
		           		    <?php if(get_theme_mod('pheromone_fot_soc_instagram') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_instagram'))) ?>"><i class="fa fa-instagram fa-fw"></i></a></li><?php }; ?> 
							<?php if(get_theme_mod('pheromone_fot_soc_youtube') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_youtube'))) ?>"><i class="fa fa-youtube-play fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_flickr') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_flickr'))) ?>"><i class="fa fa-flickr fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_tumblr') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_tumblr'))) ?>"><i class="fa fa-tumblr fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_foursquare') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_foursquare'))) ?>"><i class="fa fa-foursquare fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_vk') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_vk'))) ?>"><i class="fa fa-vk fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_behance') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_behance'))) ?>"><i class="fa fa-behance fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_pinterest') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_pinterest'))) ?>"><i class="fa fa-pinterest fa-fw"></i></a></li><?php }; ?>
							<?php if(get_theme_mod('pheromone_fot_soc_github') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_github'))) ?>"><i class="fa fa-github fa-fw"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_rss') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_rss'))) ?>"><i class="fa fa-rss fa-fw"></i></a></li><?php }; ?>   
		              </ul>
					</div>
     				<?php elseif ($pheromone_widget_footer_2_count == 'one'): ?>
					<div class="col-lg-12 col-md-12 col-sm-12 col-xs-12 one-block">
						<?php if(get_theme_mod('pheromone_fot_arrow', 'enable') == true)  { ?>
							<div class="arrow-to-top" data-wow-iteration="999" data-wow-duration="3s" class="wow flash"><a href="#page-top" class="page-scroll"><i class="icon ion-ios-arrow-up fa-2x"></i></a></div>
						<?php }; ?>	
            			<ul class="list-inline text-center">
		                  	<?php if(get_theme_mod('pheromone_fot_soc_twitter','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_twitter','http://twitter.com'))) ?>"><i class="fa fa-twitter fa-fw fa-2x"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_facebook','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_facebook','http://facebook.com'))) ?>"><i class="fa fa-facebook fa-fw fa-2x"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_googleplus','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_googleplus','http://plus.google.com'))) ?>"><i class="fa fa-google-plus fa-fw fa-2x"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_linkedin','enable') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_linkedin','http://linkedin.com'))) ?>"><i class="fa fa-linkedin fa-fw fa-2x"></i></a></li><?php }; ?> 
		                  	<?php if(get_theme_mod('pheromone_fot_soc_dribbble') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_dribbble'))) ?>"><i class="fa fa-dribbble fa-fw"></i></a></li><?php }; ?> 		                  	
		                  	<?php if(get_theme_mod('pheromone_fot_soc_instagram') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_instagram'))) ?>"><i class="fa fa-instagram fa-fw fa-2x"></i></a></li><?php }; ?> 
							<?php if(get_theme_mod('pheromone_fot_soc_youtube') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_youtube'))) ?>"><i class="fa fa-youtube-play fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_flickr') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_flickr'))) ?>"><i class="fa fa-flickr fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_tumblr') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_tumblr'))) ?>"><i class="fa fa-tumblr fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_foursquare') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_foursquare'))) ?>"><i class="fa fa-foursquare fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_vk') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_vk'))) ?>"><i class="fa fa-vk fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_behance') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_behance'))) ?>"><i class="fa fa-behance fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_pinterest') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_pinterest'))) ?>"><i class="fa fa-pinterest fa-fw fa-2x"></i></a></li><?php }; ?>
							<?php if(get_theme_mod('pheromone_fot_soc_github') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_github'))) ?>"><i class="fa fa-github fa-fw fa-2x"></i></a></li><?php }; ?>   
							<?php if(get_theme_mod('pheromone_fot_soc_rss') == true) {?><li><a target="_blank" href="<?php echo esc_url(stripslashes(get_theme_mod('pheromone_fot_soc_rss'))) ?>"><i class="fa fa-rss fa-fw fa-2x"></i></a></li><?php }; ?>   
		              </ul>
			          	<?php if(get_theme_mod('pheromone_fot_button', 'enable') == true)  { ?><p><?php echo get_theme_mod( 'pheromone_fot_button_link', wp_kses( __('<a href="https://themeforest.net/item/pheromone-creative-multiconcept-wordpress-theme/19557577?ref=DankovThemes" class="btn btn-lg btn-gray">Purchase now</a>', 'pheromone' ), array('a'=> array('href' => array(), 'class' => array())))); ?></p><?php }; ?>
						<p class="copy-info"><?php echo get_theme_mod( 'pheromone_footer_copy_3', wp_kses( __('<a href="http://themeforest.net/user/dankovthemes">©2018 <i class="fa fa-heart fa-fw"></i> DankovThemes</a>', 'pheromone' ), array('a'=> array('href' => array()),'i' => array() ))); ?></p>
				</div>
     				<?php endif; ?> 
				</div>
			</div>
		</div>
		<?php }; ?>		
	</div>
</footer>