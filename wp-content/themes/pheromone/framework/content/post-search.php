<?php
$getAllCats = wp_get_post_categories($post->ID);
?>

<article data-catslug-post="<?php echo implode(' ', $getAllCats) ?>" id="post-<?php the_ID(); ?>" <?php post_class("post-set standart-post"); ?>>
	<div class="content-block">
		<h4 class="search-result-title">
			<a href="<?php the_permalink(); ?>" title="<?php the_title_attribute(); ?>"><?php echo esc_html(get_the_title()); ?></a>
		</h4>
		<?php the_excerpt(); ?>
		<a href="<?php the_permalink() ?>" class="btn btn-white btn-sm"><?php esc_html_e('Read More', 'pheromone') ?></a>
	</div>
	<div class="clear"></div>
</article>