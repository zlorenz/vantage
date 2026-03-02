<?php $layout_value = get_theme_mod('pheromone_post_type', 'classic'); ?>
<?php if (have_posts()) : ?>
	<header class="archive-header">
		<h3 class="archive-title archive-tags">Tag: <?php printf(esc_html__('%s', 'pheromone'), '<span>' . single_cat_title('', false) . '</span>'); ?></h3>
		<?php if (category_description()) : // Show an optional category description 
		?>
			<div class="archive-meta"><?php echo category_description(); ?></div>
		<?php endif; ?>
	</header><!-- .archive-header -->

	<?php if ($layout_value == 'masonry') { ?>
		<div class="wrap-content pheromone_mas_container">
		<?php } else { ?>
			<div class="wrap-content">
			<?php } ?>

		<?php
		while (have_posts()) : the_post();
			get_template_part('framework/formats/format', get_post_format());
		endwhile;
	else :
		echo "<p class='not-found'>" . esc_html__('Sorry, no posts found under this tag.', 'pheromone') . "</p>";
	endif;
		?>
			</div>