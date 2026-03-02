    <?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    		<?php $post = get_post($id);
			$image = wp_get_attachment_image_src(get_post_thumbnail_id($id), 'wall-portfolio-squre'); ?>
    		<?php if (has_post_thumbnail()) { ?>
    			<div class="single">
    			<?php } else { ?>
    				<div class="single">
    				<?php }; ?>
    					<div class="container">
    						<div class="row">
    							<div class="col-lg-10 col-lg-offset-1 col-xs-12 col-xs-offset-0">
    								<h2><?php the_title() ?></h2>
									<div class="post-date"><i class="fa fa-calendar"></i><?php echo get_the_date('F j, Y') ?></div>
    							</div>
    						</div>
    					</div>
    				</div>
    		<?php endwhile;
	endif; ?>
    		<?php $layout_value = get_theme_mod('pheromone_single_sidebars', 'sidebar-right'); ?>
    		<div class="content">
    			<div class="container">
    				<div class="row">
    					<?php if ($layout_value == 'sidebar-left') : ?>
    						<div class="container margin">
    							<div class="row">
    								<div class="col-lg-8 col-md-8 col col-sm-12 col-xs-12 sidebar-left">
    									<div class="wrap-content">
    										<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    												<article id="post" class="single">
    													<div class="entry-content">
    														<?php get_template_part('framework/content/post'); ?>
    													</div>
    													<div class="post-comments">
    														<?php comments_template(); ?>
    													</div>

    												<?php endwhile;
											else : ?>
    												<div id="posts" class="single-post blog-page">
    													<section>
    														<article>
    															<p><?php esc_html_e('Sorry, no posts. ', 'pheromone'); ?></p>
    														</article>
    													</section>
    												</div>
    											<?php endif; ?>
    												</article>
    									</div>
    								</div>
    								<?php get_sidebar(); ?>
    							</div>
    						</div>
    					<?php elseif ($layout_value == 'sidebar-right') : ?>
    						<div class="container margin">
    							<div class="row">
    								<div class="col-lg-8 col-md-8 col col-sm-12 col-xs-12 sidebar-right">
    									<div class="wrap-content">
    										<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    												<article id="post" class="single">
    													<div class="entry-content">
    														<?php get_template_part('framework/content/post'); ?>
    													</div>
    													<div class="post-comments">
    														<?php comments_template(); ?>
    													</div>
    												<?php endwhile;
											else : ?>
    												<div id="posts" class="single-post blog-page">
    													<section>
    														<article>
    															<p><?php esc_html_e('Sorry, no posts. ', 'pheromone'); ?></p>
    														</article>
    													</section>
    												</div>
    											<?php endif; ?>
    												</article>
    									</div>
    								</div>
    								<?php get_sidebar(); ?>
    							</div>
    						</div>
    					<?php else : ?>
    						<div class="col-lg-10 col-lg-offset-1 col-xs-12 col-xs-offset-0 no-sidebar margin">
    							<div class="wrap-content">
    								<?php if (have_posts()) : while (have_posts()) : the_post(); ?>
    										<article id="post" class="single">
    											<div class="entry-content">
    												<?php get_template_part('framework/content/post'); ?>
    											</div>
    											<div class="post-comments">
    												<?php comments_template(); ?>
    											</div>
    										<?php endwhile;
									else : ?>
    										<div id="posts" class="single-post blog-page">
    											<section>
    												<article>
    													<p><?php esc_html_e('Sorry, no posts. ', 'pheromone'); ?></p>
    												</article>
    											</section>
    										</div>
    									<?php endif; ?>
    										</article>
    							</div>
    						</div>
    					<?php endif; ?>
    				</div>
    			</div>
    			<!--<div class="pagination-line">
    				<div class="container">
    					<div class="row">
    						<div class="col-lg-12">
    							<ul class="pager">
    								<li class="previous"> <?php previous_post_link('%link', '<i class="fa fa-angle-left"></i> Previous', TRUE); ?> </li>
    								<li><a href="<?php echo get_theme_mod('pheromone_single_blog', 'http://themeforest.net/'); ?>"><i class="fa ion-grid fa-2x"></i></a></li>
    								<li class="next"> <?php next_post_link('%link', 'Next <i class="fa fa-angle-right"></i>', TRUE); ?> </li>
    							</ul>
    						</div>
    					</div>
    				</div>
    			</div>-->
    		</div>