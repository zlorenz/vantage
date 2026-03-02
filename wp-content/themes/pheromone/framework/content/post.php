<?php
$getAllCats = wp_get_post_categories($post->ID);
$type_class = '';
$type_post = '';
$image_height = '';
$layout_value = get_theme_mod('pheromone_post_type', 'classic');
if ($layout_value == 'classic') :
	$type_class = 'standart-post';

elseif ($layout_value == 'medium') :
	$type_class = 'left-image-post';

elseif ($layout_value == 'masonry') :
	$type_class = 'pheromone_mas_item';

endif;
?>



<?php if (is_single()) { ?>
	<article id="post-<?php the_ID(); ?>" <?php post_class(); ?>>
	<?php } else { ?>
		<?php if (has_post_thumbnail()) { ?>
			<article data-catslug-post="<?php echo implode(' ', $getAllCats) ?>" id="post-<?php the_ID(); ?>" <?php if ($type_class != 'post-set') {
																													echo post_class("post-set $type_class");
																												} ?>>
			<?php } else { ?>
				<article data-catslug-post="<?php echo implode(' ', $getAllCats) ?>" id="post-<?php the_ID(); ?>" <?php if ($type_class != 'post-set') {
																														echo post_class("post-set no-thumbnail $type_class");
																													} ?>>
				<?php } ?>
			<?php } ?>
			<?php
			$thumbnail_id = get_post_thumbnail_id($post->ID);
			$image_url = wp_get_attachment_url($thumbnail_id);
			$image = wp_get_attachment_image_src(get_post_thumbnail_id($id), '');
			$image_height = get_theme_mod('pheromone_post_height');

			if (is_single()) { ?>
				<div class="post-content">
					<?php the_content(); ?>
					<?php $defaults = array('link_before' => '<span>',	'link_after'  => '</span>', 'before'   => '<div class="pheromone_pg_single" >',	'after' => '</div>',);
					wp_link_pages($defaults); ?>
				</div>
				<?php if (has_tag()) : ?>
					<div class="single-tags"><a href="<?php echo get_tag_link(1); ?>"><?php the_tags(); ?></a></div>
				<?php endif; ?>
				<div class="social-single">
					<?php $multicheck_value = get_theme_mod('pheromone_soc_link', array('facebook', 'twitter', 'pinterest', 'tumblr', 'google', 'linkedin')); ?>
					<?php if (!empty($multicheck_value)) : ?>
						<ul class="icon-links">
							<?php foreach ($multicheck_value as $checked_value) : ?>
								<?php if ($checked_value == 'facebook') : ?>
									<li><a href="https://www.facebook.com/sharer/sharer.php?u=<?php the_permalink(); ?>" target="_blank"><span class="fa fa-facebook"></span></a></li>
								<?php elseif ($checked_value == 'twitter') : ?>
									<li><a href="https://twitter.com/home?status=Check out this great post by <?php the_author() ?> <?php the_permalink(); ?>" target="_blank"><span class="fa fa-twitter"></span></a></li>
								<?php elseif ($checked_value == 'pinterest') : ?>
									<li><a href="https://pinterest.com/pin/create/button/?url=<?php the_permalink(); ?>&amp;media=<?php echo esc_url($image[0]) ?>&amp;description=<?php echo esc_html(get_the_title()); ?>" target="_blank"><span class="fa fa-pinterest"></span></a></li>
								<?php elseif ($checked_value == 'tumblr') : ?>
									<li><a href="http://www.tumblr.com/share/link?url=<?php the_permalink(); ?>" target="_blank"><span class="fa fa-tumblr"></span></a></li>
								<?php elseif ($checked_value == 'google') : ?>
									<li><a href="https://plus.google.com/share?url=<?php the_permalink(); ?>" target="_blank"><span class="fa fa-google"></span></a></li>
								<?php elseif ($checked_value == 'linkedin') : ?>
									<li><a href="https://www.linkedin.com/shareArticle?mini=true&url=<?php the_permalink(); ?>&title=<?php echo esc_html(get_the_title()); ?>&summary=&source=" target="_blank"><span class="fa fa-linkedin"></span></a></li>
								<?php endif; ?>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</div>
			<?php } else { ?>
				<div class="post-thumbnail">
					<img src="<?php echo esc_url($image[0]) ?>" height="<?php echo esc_attr($image_height) ?>"/>
				</div>
				<div class="content-block">
					<h4 class="post-title"><?php echo esc_html(get_the_title()); ?></h4>
					<span class="post-date"><?php echo get_the_date( '', $recent_post->ID ); ?></span>
					<div class="post-excerpt"><?php the_excerpt(); ?></div>
					<div class="read-more-btn">
						<a href="<?php the_permalink() ?>" class="btn button btn-sm"><?php esc_html_e('Read More', 'pheromone') ?></a>
					</div>
				</div>

			<?php }; ?>
			<div class="clear"></div>
				</article>